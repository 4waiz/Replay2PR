"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UploadDropzone, UploadResult } from "@/components/upload-dropzone";
import { MissionControl } from "@/components/mission-control";
import { JobData } from "@/lib/types";

export default function HomePage() {
  const [demoMode, setDemoMode] = useState(true);
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [notes, setNotes] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<{ mockMode: boolean; maxUploadMb: number } | null>(null);

  useEffect(() => {
    if (!demoMode) {
      setDemoUrl(null);
      return;
    }
    fetch("/api/demo-video")
      .then((res) => res.json())
      .then((data) => setDemoUrl(data.url))
      .catch(() => setDemoUrl(null));
  }, [demoMode]);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setStatusInfo(data))
      .catch(() => setStatusInfo(null));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchJob = async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) return;
      const data = (await res.json()) as JobData;
      if (!active) return;
      setJob(data);
      if (data.status === "success" || data.status === "error") {
        if (interval) clearInterval(interval);
      }
    };

    fetchJob();
    interval = setInterval(fetchJob, 2000);
    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [jobId]);

  const progress = useMemo(() => {
    if (!job) return 0;
    const done = job.steps.filter((step) => step.status === "success").length;
    return Math.round((done / job.steps.length) * 100);
  }, [job]);

  const canStart = demoMode || Boolean(upload?.uploadId);
  const mockMode = statusInfo?.mockMode ?? false;
  const maxUploadMb = statusInfo?.maxUploadMb ?? 50;

  const launchJob = async (
    forceDemo?: boolean,
    overrides?: { notes?: string; repoUrl?: string; upload?: UploadResult | null }
  ) => {
    const effectiveDemo = forceDemo ?? demoMode;
    const effectiveUpload = overrides?.upload ?? upload;
    const effectiveNotes = overrides?.notes ?? notes;
    const effectiveRepo = overrides?.repoUrl ?? repoUrl;

    if (!effectiveDemo && !effectiveUpload?.uploadId) {
      setError("Upload a video or enable demo mode to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoMode: effectiveDemo,
          uploadId: effectiveDemo ? undefined : effectiveUpload?.uploadId,
          uploadFilename: effectiveDemo ? undefined : effectiveUpload?.filename,
          notes: effectiveNotes,
          repoUrl: effectiveDemo ? undefined : (effectiveRepo || undefined)
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start job");
      }
      const data = await res.json();
      setJobId(data.jobId);
    } catch (err: any) {
      setError(err.message || "Failed to start job");
    } finally {
      setSubmitting(false);
    }
  };

  const startJob = () => launchJob();

  const startJudgeMode = () => {
    setDemoMode(true);
    setUpload(null);
    setRepoUrl("");
    setNotes("");
    void launchJob(true, { notes: "", repoUrl: "", upload: null });
  };

  const shareUrl = job ? `${typeof window !== "undefined" ? window.location.origin : ""}${job.shareUrl}` : "";

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Replay2PR</p>
            <p className="text-xs text-steel-400">Gemini 3 Hackathon MVP</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">Demo Ready</Badge>
          {mockMode ? <Badge variant="warning">Mock Mode</Badge> : null}
          <Button variant="ghost" size="sm" asChild>
            <a href="/demo">Open Demo Target</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-soft">
          <div className="absolute inset-0 -z-10 bg-radial-glow opacity-80" />
          <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute -right-40 top-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs uppercase tracking-[0.4em] text-steel-400">Video-to-PR Automation</p>
            <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">
              Turn bug replays into Playwright tests, verified patches, and shareable evidence packs.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-steel-300">
              Replay2PR ingests a short screen recording, extracts reproduction steps, generates a test, applies a patch,
              and ships a polished Evidence Pack in minutes.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={startJob} disabled={!canStart || submitting} className="group">
                {submitting ? "Launching" : "Run Replay"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" onClick={startJudgeMode} disabled={submitting}>
                Judge Mode
              </Button>
              <Button variant="outline" asChild>
                <a href={job?.shareUrl || "#"}>View Evidence Pack</a>
              </Button>
            </div>
          </motion.div>
        </section>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Upload + Configure</CardTitle>
              <CardDescription>Choose demo mode or upload your own bug replay video.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Demo Mode</p>
                  <p className="text-xs text-steel-400">Uses the built-in demo repo and sample video.</p>
                </div>
                <Switch checked={demoMode} onCheckedChange={setDemoMode} />
              </div>

              <UploadDropzone
                key={demoMode ? "demo" : "upload"}
                disabled={demoMode}
                demoUrl={demoMode ? demoUrl : null}
                maxMb={maxUploadMb}
                onUploaded={setUpload}
                onCleared={() => setUpload(null)}
              />

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.2em] text-steel-400">GitHub Repo (optional)</label>
                <Input
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/org/repo"
                  disabled={demoMode}
                />
                <p className="text-xs text-steel-400">Advanced mode only. Demo mode ignores this field.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.2em] text-steel-400">Notes for Gemini</label>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the model should know..." />
                {mockMode ? (
                  <p className="text-xs text-amberish-300">
                    Mock mode is active (no Gemini API key detected). Responses will use demo data.
                  </p>
                ) : null}
              </div>

              {error ? <p className="text-xs text-amberish-300">{error}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={startJob} disabled={!canStart || submitting}>
                  {submitting ? "Launching" : "Generate Evidence Pack"}
                </Button>
                {!canStart ? <span className="text-xs text-steel-400">Upload a video to continue.</span> : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {job ? (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Run Status</CardTitle>
                  <CardDescription>Job {job.id.slice(0, 6)} - {job.status.toUpperCase()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} />
                  <div className="flex flex-wrap gap-3 text-xs text-steel-300">
                    <span>Mode: {job.mode.toUpperCase()}</span>
                    <span>Steps: {job.steps.filter((step) => step.status === "success").length}/{job.steps.length}</span>
                    <span>Updated: {new Date(job.updatedAt).toLocaleTimeString()}</span>
                  </div>
                  {job.status === "queued" ? (
                    <p className="text-sm text-steel-300">Queued. Waiting for an available worker...</p>
                  ) : null}
                  {job.status === "error" ? (
                    <p className="text-sm text-amberish-300">Run failed. Check Mission Control logs for details.</p>
                  ) : null}
                  {job.status === "success" ? (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-200">Evidence pack ready.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <a href={job.shareUrl}>Open Evidence Pack</a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (shareUrl) navigator.clipboard.writeText(shareUrl);
                          }}
                        >
                          Copy Share Link
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <MissionControl job={job} />
          </div>
        </div>
      </main>
    </div>
  );
}
