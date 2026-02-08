"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobData, JobStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusMeta: Record<JobStep["status"], { label: string; color: string }> = {
  pending: { label: "Queued", color: "bg-white/10 text-steel-300" },
  running: { label: "Running", color: "bg-sky-400/20 text-sky-200" },
  success: { label: "Done", color: "bg-emerald-400/20 text-emerald-200" },
  error: { label: "Failed", color: "bg-amberish-400/20 text-amberish-200" },
  skipped: { label: "Skipped", color: "bg-white/10 text-steel-300" }
};

function StepIcon({ status }: { status: JobStep["status"] }) {
  if (status === "success") return <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
  if (status === "error") return <XCircle className="h-5 w-5 text-amberish-300" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-sky-300" />;
  return <Circle className="h-5 w-5 text-steel-500" />;
}

export function MissionControl({ job }: { job: JobData | null }) {
  if (!job) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-steel-300">
        Start a run to populate the mission timeline.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Mission Control</h2>
          <p className="text-sm text-steel-300">Track Gemini + Playwright execution live.</p>
        </div>
        <Badge
          className={cn(
            "px-3",
            job.status === "success"
              ? "bg-emerald-400/20 text-emerald-200"
              : job.status === "error"
                ? "bg-amberish-400/20 text-amberish-200"
                : "bg-sky-400/20 text-sky-200"
          )}
        >
          {job.status === "success" ? "Evidence Ready" : job.status === "error" ? "Needs Attention" : "Running"}
        </Badge>
      </div>

      <div className="relative space-y-4">
        <div className="absolute left-3 top-3 h-full w-px bg-white/10" />
        {job.steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-10"
          >
            <div className="step-dot absolute left-0 top-5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-ink-900">
              <StepIcon status={step.status} />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="text-sm text-steel-300">{step.summary || "Awaiting output..."}</p>
                </div>
                <Badge className={statusMeta[step.status].color}>{statusMeta[step.status].label}</Badge>
              </div>
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="details">
                  <AccordionTrigger className="text-xs uppercase tracking-[0.2em] text-steel-400">
                    Details
                  </AccordionTrigger>
                  <AccordionContent>
                    {step.logs.length === 0 ? (
                      <p className="text-sm text-steel-300">No logs yet.</p>
                    ) : (
                      <ScrollArea className="h-40 rounded-2xl border border-white/10 bg-ink-900/60 p-3">
                        <ul className="space-y-2 text-xs text-steel-200">
                          {step.logs.map((log, i) => (
                            <li key={`${step.id}-log-${i}`}>{log}</li>
                          ))}
                        </ul>
                      </ScrollArea>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
