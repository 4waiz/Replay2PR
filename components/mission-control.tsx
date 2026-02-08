"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobData, JobStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusMeta: Record<JobStep["status"], { label: string; color: string }> = {
  pending: { label: "Queued", color: "bg-white text-ink" },
  running: { label: "Cooking…", color: "bg-secondary text-white" },
  success: { label: "Zap!", color: "bg-success text-white" },
  error: { label: "Boss Fight", color: "bg-danger text-white" },
  skipped: { label: "Skipped", color: "bg-white text-ink" }
};

const stepMeta: Record<JobStep["id"], { label: string; emoji: string; gradient: string }> = {
  extract: { label: "Extract", emoji: "🧪", gradient: "bg-hero-cyan" },
  reproduce: { label: "Reproduce", emoji: "🎮", gradient: "bg-hero-blue" },
  patch: { label: "Patch", emoji: "🐞", gradient: "bg-hero-pink" },
  verify: { label: "Verify", emoji: "✅", gradient: "bg-hero-lime" },
  ship: { label: "Ship", emoji: "🚀", gradient: "bg-hero-cyan" }
};

function StepIcon({ status }: { status: JobStep["status"] }) {
  if (status === "success") return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === "error") return <XCircle className="h-5 w-5 text-danger" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-secondary" />;
  return <Circle className="h-5 w-5 text-muted" />;
}

export function MissionControl({ job }: { job: JobData | null }) {
  if (!job) {
    return (
      <div className="rounded-[28px] border-2 border-ink/10 bg-white/80 p-6 text-sm text-muted shadow-sticker">
        Start a run to unlock the arcade timeline.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">Arcade Run</h2>
          <p className="text-sm text-muted">Level progression for the Gemini + Playwright mission.</p>
        </div>
        <Badge
          className={cn(
            "px-3",
            job.status === "success"
              ? "bg-success text-white"
              : job.status === "error"
                ? "bg-danger text-white"
                : job.status === "queued"
                  ? "bg-white text-ink"
                  : "bg-secondary text-white"
          )}
        >
          {job.status === "success"
            ? "Victory!"
            : job.status === "error"
              ? "Needs Attention"
              : job.status === "queued"
                ? "Queued"
                : "Running"}
        </Badge>
      </div>

      <div className="rounded-[24px] border-2 border-ink/10 bg-white/80 p-4 shadow-sticker">
        <div className="flex items-center justify-between gap-2">
          {job.steps.map((step) => (
            <div key={`runway-${step.id}`} className="flex-1">
              <div className="h-2 w-full rounded-full bg-ink/10">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    step.status === "success"
                      ? "bg-success"
                      : step.status === "running"
                        ? "bg-secondary animate-pop"
                        : "bg-ink/10"
                  )}
                  style={{ width: step.status === "success" ? "100%" : step.status === "running" ? "60%" : "15%" }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted">
          {job.steps.map((step) => (
            <span key={`runway-label-${step.id}`}>{stepMeta[step.id].emoji}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {job.steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <div className="rounded-[28px] border-2 border-ink/10 bg-white/90 p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-blob text-xl shadow-pop", stepMeta[step.id].gradient)}>
                    {stepMeta[step.id].emoji}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ink">{stepMeta[step.id].label}</h3>
                    <p className="text-sm text-muted">{step.summary || "Awaiting output..."}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StepIcon status={step.status} />
                  <Badge className={statusMeta[step.status].color}>{statusMeta[step.status].label}</Badge>
                </div>
              </div>
              <Accordion type="single" collapsible className="mt-3">
                <AccordionItem value="details">
                  <AccordionTrigger className="text-xs uppercase tracking-[0.2em] text-muted">
                    Details
                  </AccordionTrigger>
                  <AccordionContent>
                    {step.logs.length === 0 ? (
                      <p className="text-sm text-muted">No logs yet.</p>
                    ) : (
                      <ScrollArea className="h-40 rounded-2xl border-2 border-ink/10 bg-white p-3">
                        <ul className="space-y-2 text-xs text-ink/80">
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
