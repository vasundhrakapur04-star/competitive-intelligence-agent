import type { ComponentType } from "react";
import { useParams, useLocation } from "wouter";
import { useGetReport } from "@workspace/api-client-react";
import { ArrowLeft, ExternalLink, Building2, Package, TrendingUp, Globe, Tag, Star, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function SourceLink({ source, sourceTitle }: { source: string; sourceTitle?: string }) {
  if (!source) return null;
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors mt-1 truncate max-w-full"
      data-testid="link-source"
      title={source}
    >
      <ExternalLink className="w-3 h-3 shrink-0" />
      <span className="truncate">{sourceTitle || source}</span>
    </a>
  );
}

function DataPoint({ label, icon: Icon, data }: { label: string; icon: ComponentType<{ className?: string }>; data: SourcedDataPoint }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono uppercase tracking-wider mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-sm text-foreground leading-relaxed">{data.value}</p>
      <SourceLink source={data.source} sourceTitle={data.sourceTitle} />
    </div>
  );
}

function BulletPoints({ label, icon: Icon, items }: { label: string; icon: ComponentType<{ className?: string }>; items: SourcedDataPoint[] }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm leading-relaxed border-l-2 border-primary/30 pl-3">
            <span className="text-foreground">{item.value}</span>
            <div>
              <SourceLink source={item.source} sourceTitle={item.sourceTitle} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompanyCard({ profile, index }: { profile: CompanyProfile; index: number }) {
  const colors = [
    "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
    "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  ];
  const color = colors[index % colors.length];

  return (
    <Card className={`border bg-gradient-to-b ${color} backdrop-blur-sm overflow-hidden`} data-testid={`card-company-${index}`}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold tracking-tight">{profile.companyName}</CardTitle>
          <Badge variant="outline" className="text-xs font-mono shrink-0">#{index + 1}</Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2 italic">{profile.overallSummary}</p>
      </CardHeader>
      <CardContent className="pt-5 space-y-6">
        <DataPoint label="Business Model" icon={Building2} data={profile.businessModel} />
        <div className="border-t border-border/30 pt-5">
          <BulletPoints label="Product Portfolio" icon={Package} items={profile.productPortfolio} />
        </div>
        <div className="border-t border-border/30 pt-5">
          <BulletPoints label="Recent Strategic Moves" icon={TrendingUp} items={profile.recentStrategicMoves} />
        </div>
        <div className="border-t border-border/30 pt-5">
          <DataPoint label="Geographic Presence" icon={Globe} data={profile.geographicPresence} />
        </div>
        <div className="border-t border-border/30 pt-5">
          <DataPoint label="Pricing Positioning" icon={Tag} data={profile.pricingPositioning} />
        </div>
        <div className="border-t border-border/30 pt-5">
          <DataPoint label="Key Differentiator" icon={Star} data={profile.keyDifferentiator} />
        </div>
      </CardContent>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[600px] rounded-xl" />)}
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
      queryKey: ["/api/intelligence/reports", id],
    },
  });

  if (isLoading) return <ReportSkeleton />;

  if (isError || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Report not found or failed to load.</p>
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
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-muted-foreground hover:text-foreground shrink-0"
              data-testid="btn-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Intelligence Brief #{typedReport.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(typedReport.createdAt), "MMM d, yyyy 'at' HH:mm")}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            FMCG Competitive Intelligence Report
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{typedReport.title}</h1>
          <div className="flex flex-wrap gap-2">
            {typedReport.companies.map((company, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-medium" data-testid={`badge-company-${idx}`}>
                {company}
              </Badge>
            ))}
          </div>
        </div>

        <div className="text-sm text-muted-foreground border border-border/50 bg-card/30 rounded-lg px-4 py-3 font-mono">
          All data points are sourced from live web searches. Click any source link to verify the original information.
        </div>

        <div
          className="grid gap-6"
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
    </div>
  );
}
