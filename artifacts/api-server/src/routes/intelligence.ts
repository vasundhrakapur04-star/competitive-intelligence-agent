import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { db } from "@workspace/db";
import { reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AnalyzeCompetitorsBody } from "@workspace/api-zod";

const router = Router();

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

interface CompanySearchData {
  company: string;
  results: {
    query: string;
    results: TavilySearchResult[];
  }[];
}

async function gatherCompanyData(company: string): Promise<CompanySearchData> {
  const queries = [
    `${company} FMCG business model revenue strategy 2024`,
    `${company} product portfolio brands categories`,
    `${company} recent acquisitions partnerships strategic moves 2024 2025`,
    `${company} geographic presence markets countries`,
    `${company} pricing strategy premium mass market positioning`,
    `${company} competitive advantage differentiator`,
  ];

  const allResults = await Promise.all(
    queries.map(async (query) => ({
      query,
      results: await searchTavily(query),
    }))
  );

  return { company, results: allResults };
}

interface SourcedDataPoint {
  value: string;
  source: string;
  sourceTitle: string;
}

interface CompanyProfile {
  companyName: string;
  businessModel: SourcedDataPoint;
  productPortfolio: SourcedDataPoint[];
  recentStrategicMoves: SourcedDataPoint[];
  geographicPresence: SourcedDataPoint;
  pricingPositioning: SourcedDataPoint;
  keyDifferentiator: SourcedDataPoint;
  overallSummary: string;
}

async function structureWithGemini(companyData: CompanySearchData[]): Promise<CompanyProfile[]> {
  const contextText = companyData
    .map(({ company, results }) => {
      const sections = results
        .map(
          ({ query, results: res }) =>
            `Query: ${query}\nResults:\n${res
              .map((r) => `- [${r.title}](${r.url}): ${r.content.slice(0, 400)}`)
              .join("\n")}`
        )
        .join("\n\n");
      return `=== ${company} ===\n${sections}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are a senior FMCG industry analyst. Based on the following web search results, create structured competitive intelligence profiles for each company.

For each company, extract and structure the following dimensions. For each data point, you MUST provide a real source URL from the search results provided.

${contextText}

Return a JSON array of company profiles. Each profile must match this exact structure:
{
  "companyName": "string",
  "businessModel": {
    "value": "Clear 2-3 sentence description of their core business model",
    "source": "actual URL from the search results",
    "sourceTitle": "title of the source article/page"
  },
  "productPortfolio": [
    {
      "value": "Description of a major product category or brand",
      "source": "actual URL from the search results",
      "sourceTitle": "title of the source"
    }
  ],
  "recentStrategicMoves": [
    {
      "value": "Description of a specific strategic move (acquisition, partnership, launch, etc.) with approximate date",
      "source": "actual URL from the search results",
      "sourceTitle": "title of the source"
    }
  ],
  "geographicPresence": {
    "value": "Description of key markets, regions, and international footprint",
    "source": "actual URL from the search results",
    "sourceTitle": "title of the source"
  },
  "pricingPositioning": {
    "value": "Description of their pricing strategy and market positioning (premium, mass market, value, etc.)",
    "source": "actual URL from the search results",
    "sourceTitle": "title of the source"
  },
  "keyDifferentiator": {
    "value": "Their single most important competitive differentiator",
    "source": "actual URL from the search results",
    "sourceTitle": "title of the source"
  },
  "overallSummary": "A 2-3 sentence executive summary of this company's competitive position"
}

Rules:
- Use ONLY URLs that actually appear in the search results provided above
- If you cannot find a specific data point, use the best available source and note the limitation in the value field
- productPortfolio should have 3-6 items
- recentStrategicMoves should have 2-4 items
- Be specific and factual, not generic
- Return only valid JSON, no markdown code blocks`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const text = response.text ?? "[]";
  const cleaned = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as CompanyProfile[];
}

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

  req.log.info("Web search complete, structuring with Gemini");

  const profiles = await structureWithGemini(companyDataArray);

  const title = `${companies.slice(0, 3).join(", ")}${companies.length > 3 ? "..." : ""} Analysis`;

  const [report] = await db
    .insert(reportsTable)
    .values({
      title,
      companies: companies as string[],
      profiles: profiles as unknown as Record<string, unknown>[],
    })
    .returning();

  if (!report) {
    res.status(500).json({ error: "Failed to save report" });
    return;
  }

  res.json({
    id: report.id,
    title: report.title,
    companies: report.companies,
    profiles: report.profiles as unknown as CompanyProfile[],
    createdAt: report.createdAt.toISOString(),
  });
});

router.get("/intelligence/reports", async (req, res) => {
  const reports = await db
    .select({
      id: reportsTable.id,
      title: reportsTable.title,
      companies: reportsTable.companies,
      createdAt: reportsTable.createdAt,
    })
    .from(reportsTable)
    .orderBy(reportsTable.createdAt);

  res.json(
    reports.map((r) => ({
      ...r,
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

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, id));

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
