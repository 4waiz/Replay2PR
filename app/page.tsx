"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Volume2, VolumeX } from "lucide-react";
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

function Mascot({ mood }: { mood: "idle" | "thinking" | "success" | "fail" }) {
  const palette = {
    idle: "#ff7ad9",
    thinking: "#7aa8ff",
    success: "#43e08f",
    fail: "#ff7b7b"
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[240px] items-center justify-center">
      <svg viewBox="0 0 240 240" className="w-full drop-shadow-[0_12px_0_rgba(30,18,60,0.12)]">
        <defs>
          <linearGradient id="blob" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette[mood]} />
            <stop offset="100%" stopColor="#ffe26a" />
          </linearGradient>
        </defs>
        <path
          d="M48 70c18-30 64-46 106-30 40 15 70 52 70 92 0 42-24 75-62 94-39 20-86 10-113-20-29-32-31-92-1-136z"
          fill="url(#blob)"
        />
        <circle cx="95" cy="110" r="10" fill="#1d1340" />
        <circle cx="145" cy="110" r="10" fill="#1d1340" />
        {mood === "thinking" ? (
          <path d="M90 150c20-10 40-10 60 0" stroke="#1d1340" strokeWidth="8" strokeLinecap="round" />
        ) : mood === "success" ? (
          <path d="M85 145c20 18 50 18 70 0" stroke="#1d1340" strokeWidth="8" strokeLinecap="round" />
        ) : mood === "fail" ? (
          <path d="M85 160c20-18 50-18 70 0" stroke="#1d1340" strokeWidth="8" strokeLinecap="round" />
        ) : (
          <path d="M95 150h50" stroke="#1d1340" strokeWidth="8" strokeLinecap="round" />
        )}
        <circle cx="60" cy="70" r="10" fill="#ffffff" opacity="0.5" />
      </svg>
      <div className="absolute -bottom-4 -right-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow-sticker">
        {mood === "success" ? "Victory!" : mood === "fail" ? "Oops!" : mood === "thinking" ? "Thinking..." : "Ready"}
      </div>
    </div>
  );
}

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
  const [soundOn, setSoundOn] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const lastStatusRef = useRef<JobData["status"] | null>(null);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, index) => ({
        left: `${(index * 11) % 100}%`,
        delay: `${(index % 6) * 0.08}s`,
        color: ["#ff7ad9", "#7aa8ff", "#57e5c4", "#ffe26a", "#ff7b7b"][index % 5]
      })),
    []
  );

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

  useEffect(() => {
    if (!job?.status) return;
    const prev = lastStatusRef.current;
    if (job.status === "success" && prev !== "success") {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 900);
      return () => clearTimeout(timer);
    }
    lastStatusRef.current = job.status;
  }, [job?.status]);

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
  const mascotMood = job?.status === "success" ? "success" : job?.status === "error" ? "fail" : job?.status === "running" ? "thinking" : "idle";

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 top-10 h-52 w-52 rounded-full bg-hero-cyan opacity-30 blur-3xl" />
        <div className="absolute right-0 top-20 h-60 w-60 rounded-full bg-hero-lime opacity-30 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-hero-pink opacity-30 blur-3xl" />
      </div>
      {showConfetti ? (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
          {confettiPieces.map((piece, index) => (
            <span
              key={`confetti-${index}`}
              className="absolute top-0 h-3 w-2 animate-confetti rounded-full"
              style={{ left: piece.left, backgroundColor: piece.color, animationDelay: piece.delay }}
            />
          ))}
        </div>
      ) : null}

      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-blob bg-hero-cyan text-ink shadow-pop">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Replay2PR</p>
            <p className="text-xs text-muted">Bug Arcade / Candy Lab Edition</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">🎮 Demo Ready</Badge>
          {mockMode ? <Badge variant="warning">🧪 Mock Mode</Badge> : null}
          <div className="flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sticker">
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>Sound</span>
            <Switch checked={soundOn} onCheckedChange={setSoundOn} aria-label="Toggle sound" />
          </div>
          <Button variant="ghost" size="sm" asChild className="wiggle-hover">
            <a href="/demo">Open Demo Target</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20">
        <section className="relative overflow-hidden rounded-[32px] border-2 border-ink/10 bg-white/90 p-10 shadow-soft">
          <div className="absolute inset-0 -z-10 bg-hero-pink opacity-30" />
          <div className="absolute -left-24 top-12 h-48 w-48 rounded-full bg-hero-blue opacity-40 blur-2xl" />
          <div className="absolute right-10 top-8 h-40 w-40 rounded-full bg-hero-lime opacity-40 blur-2xl" />

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Video-to-PR Arcade</p>
              <h1 className="mt-4 text-4xl font-semibold text-ink md:text-5xl">
                Turn bug replays into playful tests, verified patches, and shareable evidence packs.
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-muted">
                Replay2PR ingests a short screen recording, extracts reproduction steps, generates a test, applies a patch,
                and ships a polished Evidence Pack in minutes.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={startJob} disabled={!canStart || submitting} className="group wiggle-hover">
                  {submitting ? "Launching" : "Run Replay"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" onClick={startJudgeMode} disabled={submitting} className="wiggle-hover">
                  Judge Mode
                </Button>
                <Button variant="outline" asChild className="wiggle-hover">
                  <a href={job?.shareUrl || "#"}>View Evidence Pack</a>
                </Button>
              </div>
              {mockMode ? (
                <p className="mt-3 text-xs text-ink/70">
                  🧪 Mock mode active. Add `GEMINI_API_KEY` in `.env.local` for live Gemini runs.
                </p>
              ) : null}
            </motion.div>
            <div className="flex items-center justify-center">
              <Mascot mood={mascotMood} />
            </div>
          </div>
        </section>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Upload + Configure</CardTitle>
              <CardDescription>Choose demo mode or upload your own bug replay video.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-[20px] border-2 border-ink/10 bg-white px-4 py-3 shadow-sticker">
                <div>
                  <p className="text-sm font-medium text-ink">Demo Mode</p>
                  <p className="text-xs text-muted">Uses the built-in demo repo and sample video.</p>
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
                <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted">GitHub Repo (optional)</label>
                <Input
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/org/repo"
                  disabled={demoMode}
                />
                <p className="text-xs text-muted">Advanced mode only. Demo mode ignores this field.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Notes for Gemini</label>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the model should know..." />
                {mockMode ? (
                  <p className="text-xs text-ink/70">
                    Mock mode is active (no Gemini API key detected). Responses will use demo data.
                  </p>
                ) : null}
              </div>

              {error ? <p className="text-xs text-danger">{error}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={startJob} disabled={!canStart || submitting}>
                  {submitting ? "Launching" : "Generate Evidence Pack"}
                </Button>
                {!canStart ? <span className="text-xs text-muted">Upload a video to continue.</span> : null}
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
                  <div className="flex flex-wrap gap-3 text-xs text-muted">
                    <span>Mode: {job.mode.toUpperCase()}</span>
                    <span>Steps: {job.steps.filter((step) => step.status === "success").length}/{job.steps.length}</span>
                    <span>Updated: {new Date(job.updatedAt).toLocaleTimeString()}</span>
                  </div>
                  {job.status === "queued" ? (
                    <p className="text-sm text-muted">Queued. Waiting for an available worker...</p>
                  ) : null}
                  {job.status === "error" ? (
                    <p className="text-sm text-danger">Run failed. Check Mission Control logs for details.</p>
                  ) : null}
                  {job.status === "success" ? (
                    <div className="space-y-2">
                      <p className="text-sm text-success">Evidence pack ready.</p>
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
