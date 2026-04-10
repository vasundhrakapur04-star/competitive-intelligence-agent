import { useEffect, useState } from "react";
import { Loader2, Terminal, Search, Database, Fingerprint, Lock } from "lucide-react";

export function LoadingState() {
  const [step, setStep] = useState(0);

  const steps = [
    "Initializing Intelligence Agent...",
    "Querying public databases & financial filings...",
    "Parsing recent strategic moves...",
    "Benchmarking product portfolios...",
    "Extracting key differentiators...",
    "Synthesizing competitive matrix...",
    "Finalizing Intelligence Brief..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500); // Progress through steps roughly every 4.5s
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground font-mono">
      <div className="max-w-2xl w-full space-y-12">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="w-24 h-24 border border-primary/30 rounded-xl bg-card flex items-center justify-center relative z-10 shadow-2xl shadow-primary/20">
              <Terminal className="w-10 h-10 text-primary animate-pulse" />
            </div>
            {/* Scanning line effect */}
            <div className="absolute inset-0 z-20 overflow-hidden rounded-xl rounded-b-none pointer-events-none">
              <div className="w-full h-0.5 bg-primary/50 shadow-[0_0_8px_2px_rgba(var(--primary),0.5)] animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight uppercase">Agent Active</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Compiling real-time data across global markets. This operation typically takes 30-60 seconds.
            </p>
          </div>
        </div>

        <div className="bg-card border border-muted rounded-lg p-6 font-mono text-sm relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex items-center gap-2 mb-6 text-muted-foreground border-b border-muted pb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="ml-2">competitor-intel-agent.sh</span>
          </div>

          <div className="space-y-3">
            {steps.map((s, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-3 transition-opacity duration-500 ${
                  idx > step ? "opacity-0 hidden" : 
                  idx === step ? "opacity-100 text-primary" : 
                  "opacity-40 text-muted-foreground"
                }`}
              >
                <span className="shrink-0 mt-0.5">
                  {idx === step ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "✓"
                  )}
                </span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* Fake code scroll effect at bottom */}
          <div className="mt-8 pt-4 border-t border-muted/50 text-xs text-muted-foreground/30 font-mono h-24 overflow-hidden relative select-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card z-10" />
            <div className="animate-[scroll_10s_linear_infinite] opacity-50 space-y-1">
              <p>{"[info] Fetching sec_filings.json... OK"}</p>
              <p>{"[info] Parsing press_releases.xml... 42 entities found"}</p>
              <p>{"[auth] Connecting to global_markets_db..."}</p>
              <p>{"[info] Analyzing sentiment for target constraints..."}</p>
              <p>{"[warn] Rate limit approaching, backing off..."}</p>
              <p>{"[info] Extracting product hierarchy trees..."}</p>
              <p>{"[info] Cross-referencing pricing tiers..."}</p>
              <p>{"[info] Calculating differentiation vectors..."}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(96px); }
          100% { transform: translateY(0); }
        }
        @keyframes scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
}