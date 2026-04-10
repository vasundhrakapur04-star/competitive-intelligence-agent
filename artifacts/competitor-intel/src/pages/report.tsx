import { useParams, useLocation } from "wouter";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import {
  ArrowLeft,
  ExternalLink,
  Building2,
  Package,
  TrendingUp,
  Globe,
  Tag,
  Star,
  FileText,
  Calendar,
  Zap,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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

interface IntelligenceReport {
  id: number;
  title: string;
  companies: string[];
  profiles: CompanyProfile[];
  createdAt: string;
}

// Consulting-palette company colors
const COMPANY_COLORS = [
  { hex: "#1a2744", lightBg: "#eef0f6", labelClass: "text-[#1a2744]" },
  { hex: "#0c4a6e", lightBg: "#e0f2fe", labelClass: "text-sky-900" },
  { hex: "#14532d", lightBg: "#dcfce7", labelClass: "text-emerald-900" },
  { hex: "#78350f", lightBg: "#fef3c7", labelClass: "text-amber-900" },
  { hex: "#7f1d1d", lightBg: "#ffe4e6", labelClass: "text-rose-900" },
];

function detectPricingTier(text: string): "premium" | "mid" | "mass" {
  const lower = text.toLowerCase();
  if (
    lower.includes("premium") ||
    lower.includes("luxury") ||
    lower.includes("high-end") ||
    lower.includes("prestige")
  )
    return "premium";
  if (
    lower.includes("mass") ||
    lower.includes("value") ||
    lower.includes("economy") ||
    lower.includes("affordable") ||
    lower.includes("budget")
  )
    return "mass";
  return "mid";
}

function PricingBadge({ text }: { text: string }) {
  const tier = detectPricingTier(text);
  const config = {
    premium: {
      label: "Premium",
      style: { background: "#1a2744", color: "#ffffff", border: "#1a2744" },
    },
    mid: {
      label: "Mid-Market",
      style: { background: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
    },
    mass: {
      label: "Mass Market",
      style: { background: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
    },
  };
  const { label, style } = config[tier];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border"
      style={{
        background: style.background,
        color: style.color,
        borderColor: style.border,
      }}
    >
      <Tag className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function SourceLink({
  source,
  sourceTitle,
}: {
  source: string;
  sourceTitle?: string;
}) {
  if (!source) return null;
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[9px] text-slate-300 hover:text-[#1a2744] transition-colors ml-1.5"
      data-testid="link-source"
      title={sourceTitle || source}
    >
      <ExternalLink className="w-2.5 h-2.5" />
      <span className="truncate max-w-[100px]">
        {sourceTitle?.split(" ").slice(0, 4).join(" ") || "source"}
      </span>
    </a>
  );
}

function toBullets(text: string): string[] {
  return text
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
}

function BulletList({ items }: { items: SourcedDataPoint[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
          <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
          <span className="flex-1 leading-relaxed">
            {item.value}
            <SourceLink source={item.source} sourceTitle={item.sourceTitle} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function SingleBullet({ data }: { data: SourcedDataPoint }) {
  const bullets = toBullets(data.value);
  if (bullets.length <= 1) {
    return (
      <ul className="space-y-1">
        <li className="flex items-start gap-2.5 text-sm text-slate-600">
          <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
          <span className="leading-relaxed">
            {data.value}
            <SourceLink source={data.source} sourceTitle={data.sourceTitle} />
          </span>
        </li>
      </ul>
    );
  }
  return (
    <ul className="space-y-1.5">
      {bullets.map((b, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
          <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
          <span className="leading-relaxed">
            {b}
            {i === bullets.length - 1 && (
              <SourceLink source={data.source} sourceTitle={data.sourceTitle} />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
        {label}
      </span>
    </div>
  );
}

function ComparisonTable({ profiles }: { profiles: CompanyProfile[] }) {
  function UnverifiedCell() {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
        <AlertTriangle className="w-3 h-3" />
        Unverified
      </span>
    );
  }

  const dimensions = [
    {
      label: "Pricing Tier",
      icon: Tag,
      render: (p: CompanyProfile) =>
        p.limitedData ? (
          <UnverifiedCell />
        ) : (
          <PricingBadge text={p.pricingPositioning.value} />
        ),
    },
    {
      label: "Key Geography",
      icon: Globe,
      render: (p: CompanyProfile) => {
        if (p.limitedData) return <UnverifiedCell />;
        const geo = p.geographicPresence.value;
        const parts = geo.split(/[,;]/);
        return (
          <span className="text-xs text-slate-600">
            {parts.slice(0, 2).join(", ")}
          </span>
        );
      },
    },
    {
      label: "Top Category",
      icon: Package,
      render: (p: CompanyProfile) => {
        if (p.limitedData) return <UnverifiedCell />;
        const top = p.productPortfolio[0];
        if (!top) return null;
        const name = top.value.split(/[,:]/)[0].trim();
        return (
          <span className="text-xs font-medium text-slate-700">{name}</span>
        );
      },
    },
    {
      label: "Key Differentiator",
      icon: Star,
      render: (p: CompanyProfile) => {
        if (p.limitedData) return <UnverifiedCell />;
        const val = p.keyDifferentiator.value.split(".")[0].trim();
        return <span className="text-xs text-slate-600">{val}</span>;
      },
    },
  ];

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      data-testid="comparison-table"
    >
      {/* Table header bar */}
      <div className="px-5 py-3 flex items-center gap-2.5" style={{ background: "#1a2744" }}>
        <BarChart3 className="w-4 h-4 text-white/60" />
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white">
          Side-by-Side Comparison
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-5 text-[9px] font-bold text-slate-400 uppercase tracking-wider w-36">
                Dimension
              </th>
              {profiles.map((p, i) => {
                const color = COMPANY_COLORS[i % COMPANY_COLORS.length];
                return (
                  <th key={i} className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: color.hex }}
                      />
                      <span
                        className="text-xs font-bold"
                        style={{ color: color.hex }}
                      >
                        {p.companyName}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dim, di) => (
              <tr
                key={di}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    <dim.icon className="w-3 h-3" />
                    {dim.label}
                  </div>
                </td>
                {profiles.map((p, pi) => (
                  <td key={pi} className="py-3.5 px-5">
                    {dim.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SnapshotSection({ profiles }: { profiles: CompanyProfile[] }) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${Math.min(profiles.length, 5)}, minmax(0, 1fr))`,
      }}
      data-testid="snapshot-grid"
    >
      {profiles.map((profile, i) => {
        const color = COMPANY_COLORS[i % COMPANY_COLORS.length];

        if (profile.limitedData) {
          return (
            <div
              key={i}
              className="rounded-lg border border-amber-200 bg-white p-4 border-l-4"
              style={{ borderLeftColor: "#d97706" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm font-bold text-amber-800">
                  {profile.companyName}
                </span>
              </div>
              <p className="text-xs text-amber-600 leading-relaxed mb-3">
                Limited data — may not be a significant market player.
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border border-amber-200 bg-amber-50 text-amber-700">
                <AlertTriangle className="w-2.5 h-2.5" />
                Unverified
              </span>
            </div>
          );
        }

        return (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-4 border-l-4"
            style={{ borderLeftColor: color.hex }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: color.hex }}
              />
              <span
                className="text-sm font-bold"
                style={{ color: color.hex }}
              >
                {profile.companyName}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              {profile.overallSummary}
            </p>
            <PricingBadge text={profile.pricingPositioning.value} />
          </div>
        );
      })}
    </div>
  );
}

function LimitedDataCard({
  profile,
  index,
}: {
  profile: CompanyProfile;
  index: number;
}) {
  const color = COMPANY_COLORS[index % COMPANY_COLORS.length];
  return (
    <div
      className="rounded-xl bg-white border border-amber-200 shadow-sm overflow-hidden border-l-4"
      style={{ borderLeftColor: "#d97706" }}
      data-testid={`card-limited-${index}`}
    >
      <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
        <h3 className="text-base font-bold" style={{ color: color.hex }}>
          {profile.companyName}
        </h3>
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border border-amber-200 bg-amber-50 text-amber-700">
          <AlertTriangle className="w-2.5 h-2.5" />
          Limited Data
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-amber-800">
              Limited data found — this may not be a significant market player.
            </p>
            <p className="text-sm text-amber-700">Results may be unreliable.</p>
            {profile.limitedDataReason && (
              <p className="text-xs text-amber-600 mt-2 pt-2 border-t border-amber-200">
                <span className="font-medium">Reason: </span>
                {profile.limitedDataReason}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyCard({
  profile,
  index,
}: {
  profile: CompanyProfile;
  index: number;
}) {
  if (profile.limitedData) {
    return <LimitedDataCard profile={profile} index={index} />;
  }

  const color = COMPANY_COLORS[index % COMPANY_COLORS.length];
  return (
    <div
      className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden border-l-4"
      style={{ borderLeftColor: color.hex }}
      data-testid={`card-company-${index}`}
    >
      {/* Card header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color.hex }}
          />
          <h3 className="text-sm font-bold" style={{ color: color.hex }}>
            {profile.companyName}
          </h3>
        </div>
        <PricingBadge text={profile.pricingPositioning.value} />
      </div>

      {/* Card body */}
      <div className="px-6 py-5 space-y-5">
        <div>
          <SectionLabel icon={Building2} label="Business Model" />
          <SingleBullet data={profile.businessModel} />
        </div>

        <div>
          <SectionLabel icon={Package} label="Product Portfolio" />
          <BulletList items={profile.productPortfolio} />
        </div>

        <div>
          <SectionLabel icon={TrendingUp} label="Strategic Moves" />
          <BulletList items={profile.recentStrategicMoves} />
        </div>

        <div>
          <SectionLabel icon={Globe} label="Geographic Presence" />
          <SingleBullet data={profile.geographicPresence} />
        </div>

        <div>
          <SectionLabel icon={Zap} label="Key Differentiator" />
          <SingleBullet data={profile.keyDifferentiator} />
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3 text-slate-300" />
          <span className="text-[9px] text-slate-400">
            Sources verified from live web searches —{" "}
            <a
              href={profile.businessModel.source}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1a2744] transition-colors underline underline-offset-2"
            >
              view primary source
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="h-14 bg-[#1a2744]" />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[520px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  num,
  icon: Icon,
  label,
}: {
  num: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[10px] font-bold text-slate-300 font-mono tabular-nums">
        {num}
      </span>
      <div className="w-px h-4 bg-slate-200" />
      <Icon className="w-3.5 h-3.5 text-[#1a2744]" />
      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1a2744]">
        {label}
      </span>
    </div>
  );
}

export default function Report() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = Number(params.id);

  const { data: report, isLoading, isError } = useGetReport(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getGetReportQueryKey(id),
    },
  });

  if (isLoading) return <ReportSkeleton />;

  if (isError || !report) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
        <header className="bg-[#1a2744] h-14" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-slate-500 text-sm">
              Report not found or failed to load.
            </p>
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a2744] hover:underline"
              data-testid="btn-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typedReport = report as unknown as IntelligenceReport;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Top nav bar */}
      <header className="bg-[#1a2744]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              data-testid="btn-back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2 text-white/60">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tracking-wider">
                Intelligence Brief #{typedReport.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(typedReport.createdAt), "MMMM d, yyyy")}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-10">
        {/* Report title */}
        <div className="pb-8 border-b border-slate-200">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1a2744] mb-2">
            Competitive Intelligence Brief
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            {typedReport.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(typedReport.createdAt), "MMMM d, yyyy")}
            </span>
            <span>·</span>
            <span>{typedReport.companies.length} companies analyzed</span>
            <span>·</span>
            <span className="font-semibold" style={{ color: "#1a2744" }}>
              Confidential
            </span>
          </div>
        </div>

        {/* 01 — Executive Snapshot */}
        <div>
          <SectionHeading num="01" icon={Zap} label="Executive Snapshot" />
          <SnapshotSection profiles={typedReport.profiles} />
        </div>

        {/* 02 — Comparative Analysis */}
        <div>
          <SectionHeading num="02" icon={BarChart3} label="Comparative Analysis" />
          <ComparisonTable profiles={typedReport.profiles} />
        </div>

        {/* 03 — Detailed Intelligence */}
        <div>
          <SectionHeading num="03" icon={FileText} label="Detailed Intelligence" />
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: `repeat(${Math.min(typedReport.profiles.length, 3)}, minmax(0, 1fr))`,
            }}
            data-testid="report-grid"
          >
            {typedReport.profiles.map((profile, idx) => (
              <CompanyCard key={idx} profile={profile} index={idx} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-300">
          <span>
            Generated by Competitive Intelligence Platform · Powered by Gemini
            AI &amp; Tavily Search
          </span>
          <span className="font-mono">
            Brief #{typedReport.id} ·{" "}
            {format(new Date(typedReport.createdAt), "yyyy-MM-dd")}
          </span>
        </div>
      </div>
    </div>
  );
}
