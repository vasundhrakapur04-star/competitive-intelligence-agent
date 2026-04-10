import { useLocation } from "wouter";
import { useAnalyzeCompetitors, useListReports } from "@workspace/api-client-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, BarChart3, ChevronRight, ArrowRight } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/loading-state";
import { format } from "date-fns";

const formSchema = z.object({
  companies: z
    .array(
      z.object({
        name: z.string().min(1, "Company name is required."),
      })
    )
    .min(1, "You must provide at least 1 company.")
    .max(5, "You can provide at most 5 companies."),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: reports, isLoading: isLoadingReports } = useListReports();
  const analyzeCompetitors = useAnalyzeCompetitors();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companies: [{ name: "" }, { name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "companies",
    control: form.control,
  });

  function onSubmit(data: FormValues) {
    const companyNames = data.companies.map((c) => c.name).filter(Boolean);
    analyzeCompetitors.mutate(
      { data: { companies: companyNames } },
      {
        onSuccess: (report) => {
          setLocation(`/report/${report.id}`);
        },
      }
    );
  }

  if (analyzeCompetitors.isPending) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Navigation bar */}
      <header className="bg-[#1a2744]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-white/60" />
            <span className="text-sm font-semibold tracking-wide text-white">
              Competitive Intelligence
            </span>
          </div>
          <span className="hidden sm:block text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">
            Powered by Gemini AI · Tavily Search
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left Column: Hero + Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Hero */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1a2744]">
                Market Intelligence Platform
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
                Precision Benchmarking.
                <br />
                <span className="text-slate-300">Zero Guesswork.</span>
              </h1>
              <p className="text-base text-slate-500 max-w-xl leading-relaxed">
                Enter up to 5 companies to generate a deep-dive intelligence
                brief. Our AI agent surfaces real-time data on business models,
                strategic moves, and competitive positioning.
              </p>
            </div>

            {/* Analysis form */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">New Analysis</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define your competitive set for benchmarking
                </p>
              </div>

              <div className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <FormField
                          key={field.id}
                          control={form.control}
                          name={`companies.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              {index === 0 && (
                                <FormLabel className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400">
                                  Companies
                                </FormLabel>
                              )}
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {index + 1}
                                  </span>
                                </div>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={
                                      index === 0
                                        ? "e.g. Apple"
                                        : index === 1
                                        ? "e.g. Samsung"
                                        : index === 2
                                        ? "e.g. Sony"
                                        : index === 3
                                        ? "e.g. LG"
                                        : "e.g. Xiaomi"
                                    }
                                    className="h-10 text-sm bg-slate-50 border-slate-200 focus-visible:ring-[#1a2744] focus-visible:border-[#1a2744]"
                                    data-testid={`input-company-${index}`}
                                  />
                                </FormControl>
                                {fields.length > 1 && (
                                  <button
                                    type="button"
                                    className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                    onClick={() => remove(index)}
                                    data-testid={`btn-remove-company-${index}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <FormMessage className="text-xs ml-8" />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => append({ name: "" })}
                        disabled={fields.length >= 5}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#1a2744] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        data-testid="btn-add-company"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add company
                      </button>
                      <span className="text-[10px] text-slate-300 font-mono tabular-nums">
                        {fields.length} of 5
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold bg-[#1a2744] hover:bg-[#243358] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={analyzeCompetitors.isPending}
                      data-testid="btn-submit-analysis"
                    >
                      {analyzeCompetitors.isPending ? (
                        "Initializing..."
                      ) : (
                        <>
                          Generate Intelligence Brief
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </Form>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Briefs */}
          <div className="lg:col-span-5 space-y-5">
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
              Recent Briefs
            </div>

            <div className="space-y-3">
              {isLoadingReports ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-lg bg-slate-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="group bg-white border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-[#1a2744] hover:shadow-sm transition-all"
                    onClick={() => setLocation(`/report/${report.id}`)}
                    data-testid={`card-report-${report.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <span className="text-sm font-semibold text-slate-800 group-hover:text-[#1a2744] transition-colors leading-tight">
                        {report.title}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5 font-mono">
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {report.companies.map((company, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-slate-300 group-hover:text-[#1a2744] transition-colors">
                      View Report
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-slate-200 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400 text-center leading-relaxed">
                    No briefs generated yet.
                    <br />
                    <span className="text-xs text-slate-300">
                      Your analyses will appear here.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
