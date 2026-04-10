import { useParams, useLocation } from "wouter";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import {
  ArrowLeft, ExternalLink, Building2, Package, TrendingUp,
  Globe, Tag, Star, FileText, Calendar, Zap, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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

interface IntelligenceReport {
  id: number;
  title: string;
  companies: string[];
  profiles: CompanyProfile[];
  createdAt: string;
}

function detectPricingTier(text: string): "premium" | "mid" | "mass" {
  const lower = text.toLowerCase();
  if (lower.includes("premium") || lower.includes("luxury") || lower.includes("high-end") || lower.includes("prestige")) return "premium";
  if (lower.includes("mass") || lower.includes("value") || lower.includes("economy") || lower.includes("affordable") || lower.includes("budget")) return "mass";
  return "mid";
}

function PricingBadge({ text }: { text: string }) {
  const tier = detectPricingTier(text);
  const config = {
    premium: { label: "Premium", className: "bg-violet-100 text-violet-700 border-violet-200" },
    mid: { label: "Mid-Market", className: "bg-amber-100 text-amber-700 border-amber-200" },
    mass: { label: "Mass Market", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  };
  const { label, className } = config[tier];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${className}`}>
      <Tag className="w-3 h-3" />
      {label}
    </span>
  );
}

function SourceLink({ source, sourceTitle }: { source: string; sourceTitle?: string }) {
  if (!source) return null;
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-blue-500 transition-colors ml-1"
      data-testid="link-source"
      title={sourceTitle || source}
    >
      <ExternalLink className="w-2.5 h-2.5" />
      <span className="truncate max-w-[120px]">{sourceTitle?.split(" ").slice(0, 4).join(" ") || "source"}</span>
    </a>
  );
}

function toBullets(text: string): string[] {
  // Split on common sentence-ending punctuation or semicolons, then trim
  const raw = text
    .split(/[.;]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);
  // Cap each bullet at ~80 chars
  return raw.map(s => (s.length > 90 ? s.slice(0, 87) + "…" : s)).slice(0, 4);
}

function BulletList({ items }: { items: SourcedDataPoint[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => {
        const bullets = toBullets(item.value);
        const mainText = bullets[0] || item.value.slice(0, 90);
        return (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span className="flex-1 leading-snug">
              {mainText}
              <SourceLink source={item.source} sourceTitle={item.sourceTitle} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SingleBullet({ data }: { data: SourcedDataPoint }) {
  const bullets = toBullets(data.value);
  return (
    <ul className="space-y-1">
      {bullets.slice(0, 3).map((b, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span className="leading-snug">{b}</span>
        </li>
      ))}
      {bullets.length === 0 && (
        <li className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span className="leading-snug">
            {data.value.slice(0, 90)}
            <SourceLink source={data.source} sourceTitle={data.sourceTitle} />
          </span>
        </li>
      )}
    </ul>
  );
}

const COMPANY_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-600", text: "text-blue-700", light: "bg-blue-100" },
  { bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-600", text: "text-violet-700", light: "bg-violet-100" },
  { bg: "bg-teal-50", border: "border-teal-200", accent: "bg-teal-600", text: "text-teal-700", light: "bg-teal-100" },
  { bg: "bg-orange-50", border: "border-orange-200", accent: "bg-orange-600", text: "text-orange-700", light: "bg-orange-100" },
  { bg: "bg-pink-50", border: "border-pink-200", accent: "bg-pink-600", text: "text-pink-700", light: "bg-pink-100" },
];

function ComparisonTable({ profiles }: { profiles: CompanyProfile[] }) {
  const dimensions = [
    {
      label: "Pricing Tier",
      icon: Tag,
      render: (p: CompanyProfile) => <PricingBadge text={p.pricingPositioning.value} />,
    },
    {
      label: "Key Geography",
      icon: Globe,
      render: (p: CompanyProfile) => {
        const geo = p.geographicPresence.value;
        const parts = geo.split(/[,;]/);
        return <span className="text-xs text-slate-600">{parts.slice(0, 2).join(", ")}</span>;
      },
    },
    {
      label: "Top Category",
      icon: Package,
      render: (p: CompanyProfile) => {
        const top = p.productPortfolio[0];
        if (!top) return null;
        const name = top.value.split(/[,.:]/)[0].slice(0, 35);
        return <span className="text-xs font-medium text-slate-700">{name}</span>;
      },
    },
    {
      label: "Key Differentiator",
      icon: Star,
      render: (p: CompanyProfile) => {
        const val = p.keyDifferentiator.value.split(".")[0].slice(0, 55);
        return <span className="text-xs text-slate-600">{val}</span>;
      },
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" data-testid="comparison-table">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-slate-700">Side-by-Side Comparison</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-36">Dimension</th>
              {profiles.map((p, i) => (
                <th key={i} className="py-3 px-5">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${COMPANY_COLORS[i % COMPANY_COLORS.length].light} ${COMPANY_COLORS[i % COMPANY_COLORS.length].text}`}>
                    <span className={`w-2 h-2 rounded-full ${COMPANY_COLORS[i % COMPANY_COLORS.length].accent}`} />
                    {p.companyName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dim, di) => (
              <tr key={di} className={`border-b border-slate-50 ${di % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <dim.icon className="w-3.5 h-3.5" />
                    {dim.label}
                  </div>
                </td>
                {profiles.map((p, pi) => (
                  <td key={pi} className="py-3 px-5">{dim.render(p)}</td>
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
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(profiles.length, 5)}, minmax(0, 1fr))` }} data-testid="snapshot-grid">
      {profiles.map((profile, i) => {
        const color = COMPANY_COLORS[i % COMPANY_COLORS.length];
        return (
          <div key={i} className={`rounded-xl border p-4 ${color.bg} ${color.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-3 h-3 rounded-full ${color.accent}`} />
              <span className={`text-sm font-bold ${color.text}`}>{profile.companyName}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{profile.overallSummary.slice(0, 120)}{profile.overallSummary.length > 120 ? "…" : ""}</p>
            <div className="mt-3">
              <PricingBadge text={profile.pricingPositioning.value} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
      <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function CompanyCard({ profile, index }: { profile: CompanyProfile; index: number }) {
  const color = COMPANY_COLORS[index % COMPANY_COLORS.length];
  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${color.border}`} data-testid={`card-company-${index}`}>
      <div className={`h-1.5 w-full ${color.accent}`} />
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-bold ${color.text}`}>{profile.companyName}</h3>
          <PricingBadge text={profile.pricingPositioning.value} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <SectionHeader icon={Building2} label="Business Model" />
          <SingleBullet data={profile.businessModel} />
        </div>

        <div>
          <SectionHeader icon={Package} label="Product Portfolio" />
          <BulletList items={profile.productPortfolio} />
        </div>

        <div>
          <SectionHeader icon={TrendingUp} label="Strategic Moves" />
          <BulletList items={profile.recentStrategicMoves} />
        </div>

        <div>
          <SectionHeader icon={Globe} label="Geographic Presence" />
          <SingleBullet data={profile.geographicPresence} />
        </div>

        <div>
          <SectionHeader icon={Zap} label="Key Differentiator" />
          <SingleBullet data={profile.keyDifferentiator} />
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] text-slate-400">
            Sources verified from live web searches —
            <a href={profile.businessModel.source} target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-blue-500 transition-colors underline underline-offset-2">view primary source</a>
          </span>
        </div>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[520px] rounded-xl" />)}
        </div>
      </div>
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-500">Report not found or failed to load.</p>
          <Button onClick={() => setLocation("/")} variant="outline" data-testid="btn-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const typedReport = report as unknown as IntelligenceReport;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-slate-500 hover:text-slate-800 -ml-2"
              data-testid="btn-back"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText className="w-3.5 h-3.5" />
              Intelligence Brief #{typedReport.id}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(typedReport.createdAt), "MMM d, yyyy")}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">FMCG Intelligence Report</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{typedReport.title}</h1>
        </div>

        {/* Competitive Snapshot */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Competitive Snapshot</h2>
          </div>
          <SnapshotSection profiles={typedReport.profiles} />
        </div>

        {/* Comparison Table */}
        <ComparisonTable profiles={typedReport.profiles} />

        {/* Detailed Company Cards */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detailed Intelligence</h2>
          </div>
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: `repeat(${Math.min(typedReport.profiles.length, 3)}, minmax(0, 1fr))` }}
            data-testid="report-grid"
          >
            {typedReport.profiles.map((profile, idx) => (
              <CompanyCard key={idx} profile={profile} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
