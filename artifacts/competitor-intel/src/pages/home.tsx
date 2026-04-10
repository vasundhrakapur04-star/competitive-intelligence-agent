import { useState } from "react";
import { useLocation } from "wouter";
import { useAnalyzeCompetitors, useListReports } from "@workspace/api-client-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Search, BarChart3, Clock, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { format } from "date-fns";

const formSchema = z.object({
  companies: z
    .array(
      z.object({
        name: z.string().min(2, "Company name must be at least 2 characters."),
      })
    )
    .min(3, "You must provide at least 3 companies.")
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
      companies: [{ name: "" }, { name: "" }, { name: "" }],
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
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 font-sans selection:bg-primary/30">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Title and Input */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              CIA - Competitor Intelligence Agent
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Precision Benchmarking. <br className="hidden md:block" />
              <span className="text-muted-foreground">Zero Guesswork.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Enter 3 to 5 FMCG competitors to generate a deep-dive intelligence brief. 
              Our agent sources real-time data on business models, strategic moves, and product portfolios.
            </p>
          </div>

          <Card className="border-muted bg-card shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                New Analysis
              </CardTitle>
              <CardDescription>
                Define your competitive set for benchmarking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`companies.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index === 0 ? "" : "sr-only"}>
                              {index === 0 ? "Competitors" : "Additional Competitor"}
                            </FormLabel>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs w-4 text-center">
                                  {index + 1}
                                </span>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder={
                                      index === 0 ? "e.g. Unilever" : 
                                      index === 1 ? "e.g. Procter & Gamble" : 
                                      index === 2 ? "e.g. Nestle" : "Company Name"
                                    }
                                    className="pl-9 bg-background border-muted h-12 text-base font-medium placeholder:font-normal focus-visible:ring-primary"
                                    data-testid={`input-company-${index}`}
                                  />
                                </FormControl>
                              </div>
                              {fields.length > 3 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-12 w-12"
                                  onClick={() => remove(index)}
                                  data-testid={`btn-remove-company-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ name: "" })}
                      disabled={fields.length >= 5}
                      className="text-xs border-dashed border-muted-foreground/30 hover:border-primary/50 hover:text-primary transition-colors"
                      data-testid="btn-add-company"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Competitor
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono">
                      {fields.length} / 5 Selected
                    </span>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
                    disabled={analyzeCompetitors.isPending}
                    data-testid="btn-submit-analysis"
                  >
                    {analyzeCompetitors.isPending ? (
                      "Initializing Agent..."
                    ) : (
                      <>
                        Generate Intelligence Brief
                        <ChevronRight className="w-5 h-5 ml-2 opacity-70" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Reports */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Briefs
            </h2>
          </div>

          <div className="space-y-4">
            {isLoadingReports ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 rounded-lg bg-card animate-pulse border border-muted" />
                ))}
              </div>
            ) : reports && reports.length > 0 ? (
              reports.map((report) => (
                <Card 
                  key={report.id} 
                  className="bg-card border-muted hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => setLocation(`/report/${report.id}`)}
                  data-testid={`card-report-${report.id}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
                        {report.title}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {report.companies.map((company, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded-sm bg-muted text-xs font-medium text-muted-foreground"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
                      View Full Report
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-muted rounded-lg bg-card/50">
                <BarChart3 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No recent intelligence briefs found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}