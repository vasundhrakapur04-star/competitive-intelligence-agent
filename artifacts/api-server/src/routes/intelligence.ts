import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { AnalyzeCompetitorsBody } from "@workspace/api-zod";

const router = Router();

// ─── In-memory report store (no database needed) ────────────────────────────

interface StoredReport {
  id: number;
  title: string;
  companies: string[];
  profiles: CompanyProfile[];
  createdAt: Date;
}

let nextId = 1;
const reports: StoredReport[] = [];

// ─── Gemini client (direct Google GenAI SDK) ────────────────────────────────

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

// ─── Tavily search ──────────────────────────────────────────────────────────

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
}

async function searchTavily(query: string): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 5,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily API error: ${response.status} - ${text}`);
  }

  const data = (await response.json()) as TavilyResponse;
  return data.results || [];
}

// ─── Company data gathering ─────────────────────────────────────────────────

interface CompanySearchData {
  company: string;
  results: {
    query: string;
    results: TavilySearchResult[];
  }[];
}

async function gatherCompanyData(company: string): Promise<CompanySearchData> {
  const queries = [
    `${company} business model revenue strategy 2024`,
    `${company} product portfolio brands categories`,
    `${company} recent acquisitions partnerships strategic moves 2024 2025`,
    `${company} geographic presence markets countries`,
    `${company} pricing strategy market positioning`,
    `${company} competitive advantage key differentiator`,
  ];

  const allResults = await Promise.all(
    queries.map(async (query) => ({
      query,
      results: await searchTavily(query),
    }))
  );

  return { company, results: allResults };
}

// ─── Company data quality validation ────────────────────────────────────────

interface DataQualityResult {
  isLimitedData: boolean;
  reason: string;
}

function assessDataQuality(companyData: CompanySearchData): DataQualityResult {
  const { company, results } = companyData;
  const allResults = results.flatMap((r) => r.results);

  const totalResults = allResults.length;
  const totalChars = allResults.reduce((sum, r) => sum + (r.content?.length ?? 0), 0);
  const avgScore =
    totalResults > 0
      ? allResults.reduce((sum, r) => sum + (r.score ?? 0), 0) / totalResults
      : 0;

  const companyLower = company.toLowerCase();
  const mentionsCompany = allResults.filter(
    (r) =>
      r.title?.toLowerCase().includes(companyLower) ||
      r.content?.toLowerCase().includes(companyLower)
  ).length;

  if (totalResults < 5) {
    return {
      isLimitedData: true,
      reason: `Only ${totalResults} search results found — insufficient data to build a reliable profile.`,
    };
  }

  if (totalChars < 600) {
    return {
      isLimitedData: true,
      reason: `Very little content found across all searches (${totalChars} characters) — this company may not have significant web presence.`,
    };
  }

  if (avgScore < 0.25) {
    return {
      isLimitedData: true,
      reason: `Search results had very low relevance scores (avg ${avgScore.toFixed(2)}) — the company may not be a well-known market player.`,
    };
  }

  if (mentionsCompany < 3) {
    return {
      isLimitedData: true,
      reason: `Fewer than 3 search results directly reference "${company}" — it may be too obscure or not a significant market participant.`,
    };
  }

  return { isLimitedData: false, reason: "" };
}

// ─── Profile types ──────────────────────────────────────────────────────────

interface SourcedDataPoint {
  value: string;
  source: string;
  sourceTitle: string;
}

interface CompanyProfile {
  companyName: string;
  limitedData?: boolean;
  limitedDataReason?: string;
  businessModel: SourcedDataPoint;
  productPortfolio: SourcedDataPoint[];
  recentStrategicMoves: SourcedDataPoint[];
  geographicPresence: SourcedDataPoint;
  pricingPositioning: SourcedDataPoint;
  keyDifferentiator: SourcedDataPoint;
  overallSummary: string;
}

function buildLimitedDataProfile(company: string, reason: string): CompanyProfile {
  const stub: SourcedDataPoint = { value: "Insufficient data", source: "", sourceTitle: "" };
  return {
    companyName: company,
    limitedData: true,
    limitedDataReason: reason,
    businessModel: stub,
    productPortfolio: [stub],
    recentStrategicMoves: [stub],
    geographicPresence: stub,
    pricingPositioning: stub,
    keyDifferentiator: stub,
    overallSummary: "Insufficient data found to generate a meaningful profile.",
  };
}

// ─── Gemini structuring ─────────────────────────────────────────────────────

async function structureOneCompany(companyData: CompanySearchData): Promise<CompanyProfile> {
  const { company, results } = companyData;

  const quality = assessDataQuality(companyData);
  if (quality.isLimitedData) {
    return buildLimitedDataProfile(company, quality.reason);
  }

  const contextText = results
    .map(
      ({ query, results: res }) =>
        `Query: ${query}\nSources:\n${res
          .map((r) => `- URL: ${r.url}\n  Title: ${r.title}\n  Snippet: ${r.content.slice(0, 250)}`)
          .join("\n")}`
    )
    .join("\n\n");

  const schema = {
    type: "object" as const,
    properties: {
      companyName: { type: "string" as const },
      businessModel: {
        type: "object" as const,
        properties: {
          value: { type: "string" as const },
          source: { type: "string" as const },
          sourceTitle: { type: "string" as const },
        },
        required: ["value", "source", "sourceTitle"],
      },
      productPortfolio: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            value: { type: "string" as const },
            source: { type: "string" as const },
            sourceTitle: { type: "string" as const },
          },
          required: ["value", "source", "sourceTitle"],
        },
      },
      recentStrategicMoves: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            value: { type: "string" as const },
            source: { type: "string" as const },
            sourceTitle: { type: "string" as const },
          },
          required: ["value", "source", "sourceTitle"],
        },
      },
      geographicPresence: {
        type: "object" as const,
        properties: {
          value: { type: "string" as const },
          source: { type: "string" as const },
          sourceTitle: { type: "string" as const },
        },
        required: ["value", "source", "sourceTitle"],
      },
      pricingPositioning: {
        type: "object" as const,
        properties: {
          value: { type: "string" as const },
          source: { type: "string" as const },
          sourceTitle: { type: "string" as const },
        },
        required: ["value", "source", "sourceTitle"],
      },
      keyDifferentiator: {
        type: "object" as const,
        properties: {
          value: { type: "string" as const },
          source: { type: "string" as const },
          sourceTitle: { type: "string" as const },
        },
        required: ["value", "source", "sourceTitle"],
      },
      overallSummary: { type: "string" as const },
    },
    required: [
      "companyName",
      "businessModel",
      "productPortfolio",
      "recentStrategicMoves",
      "geographicPresence",
      "pricingPositioning",
      "keyDifferentiator",
      "overallSummary",
    ],
  };

  const prompt = `You are a senior competitive intelligence analyst. Based on the following web search results for ${company}, produce a structured competitive intelligence profile.

${contextText}

Instructions:
- companyName: "${company}"
- businessModel.value: 2-3 sentence description of their core business model
- productPortfolio: 3-5 key product categories or brands (each with source URL from the results)
- recentStrategicMoves: 2-3 specific moves from 2023-2025 (acquisitions, launches, partnerships) with dates
- geographicPresence.value: key markets and international footprint
- pricingPositioning.value: pricing tier and market positioning (e.g. premium, mid-market, mass-market, value)
- keyDifferentiator.value: their single most important competitive edge
- overallSummary: 2-sentence executive summary

For every source field: use a real URL that appears in the search results above. If a specific URL fits multiple fields, reuse it.`;

  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      maxOutputTokens: 8192,
    },
  });

  const text = response.text ?? "{}";
  const cleaned = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as CompanyProfile;
}

async function structureWithGemini(companyData: CompanySearchData[]): Promise<CompanyProfile[]> {
  return Promise.all(companyData.map((data) => structureOneCompany(data)));
}

// ─── Routes ─────────────────────────────────────────────────────────────────

router.post("/intelligence/analyze", async (req, res) => {
  const parseResult = AnalyzeCompetitorsBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { companies } = parseResult.data;

  req.log.info({ companies }, "Starting competitor analysis");

  const companyDataArray = await Promise.all(
    companies.map((company) => gatherCompanyData(company))
  );

  req.log.info("Web search complete, validating companies and structuring with Gemini");

  const profiles = await structureWithGemini(companyDataArray);

  const title = `${companies.slice(0, 3).join(", ")}${companies.length > 3 ? "..." : ""} Analysis`;

  const report: StoredReport = {
    id: nextId++,
    title,
    companies,
    profiles,
    createdAt: new Date(),
  };
  reports.push(report);

  res.json({
    id: report.id,
    title: report.title,
    companies: report.companies,
    profiles: report.profiles,
    createdAt: report.createdAt.toISOString(),
  });
});

router.get("/intelligence/reports", async (_req, res) => {
  const sorted = [...reports].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  res.json(
    sorted.map((r) => ({
      id: r.id,
      title: r.title,
      companies: r.companies,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.get("/intelligence/reports/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }

  const report = reports.find((r) => r.id === id);

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json({
    id: report.id,
    title: report.title,
    companies: report.companies,
    profiles: report.profiles,
    createdAt: report.createdAt.toISOString(),
  });
});

export default router;
