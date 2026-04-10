import { useEffect, useState } from "react";
import { Loader2, BarChart3, CheckCircle2 } from "lucide-react";

export function LoadingState() {
  const [step, setStep] = useState(0);

  const steps = [
    { label: "Initializing analysis engine", sub: "Connecting to data sources" },
    { label: "Gathering market intelligence", sub: "Querying web, filings & databases" },
    { label: "Analyzing strategic moves", sub: "Parsing recent announcements" },
    { label: "Benchmarking product portfolios", sub: "Cross-referencing product lines" },
    { label: "Extracting key differentiators", sub: "Identifying competitive advantages" },
    { label: "Synthesizing findings", sub: "Building comparison matrix" },
    { label: "Preparing your brief", sub: "Formatting intelligence report" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, [steps.length]);

  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      {/* Nav bar */}
      <header className="bg-[#1a2744] h-14 flex items-center px-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-white/60" />
          <span className="text-sm font-semibold tracking-wide text-white">Competitive Intelligence</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Icon + heading */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1a2744] mb-5 shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Preparing Intelligence Brief
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our AI agent is gathering real-time competitive data.<br />
              This typically takes 30–60 seconds.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#1a2744]">
                {steps[step]?.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono tabular-nums">{progress}%</span>
            </div>
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, background: "#1a2744" }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{steps[step]?.sub}</p>
          </div>

          {/* Steps list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-5 py-3 transition-opacity duration-500 ${
                  idx > step ? "opacity-30" : "opacity-100"
                }`}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {idx < step ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1a2744]" />
                  ) : idx === step ? (
                    <Loader2 className="w-4 h-4 text-[#1a2744] animate-spin" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-300">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    idx === step
                      ? "font-semibold text-slate-900"
                      : idx < step
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
