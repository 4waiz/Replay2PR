"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { JobData } from "@/lib/types";

export default function EvidencePage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/jobs/${params.id}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen px-6 py-12 text-center text-steel-300">
        Evidence pack not found.
      </div>
    );
  }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${job.shareUrl}`;

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-steel-400">Evidence Pack</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Job {job.id.slice(0, 8)}</h1>
            <p className="text-sm text-steel-300">Replay2PR generated evidence and verification artifacts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              <ClipboardCopy className="h-4 w-4" />
              Copy Share Link
            </Button>
          </div>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>What Replay2PR observed and validated.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-steel-400">Status</p>
              <Badge className={job.status === "success" ? "bg-emerald-400/20 text-emerald-200" : "bg-amberish-400/20 text-amberish-200"}>
                {job.status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-steel-400">Mode</p>
              <p className="text-sm text-steel-100">{job.mode.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-steel-400">Updated</p>
              <p className="text-sm text-steel-100">{new Date(job.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Reproduction Steps</CardTitle>
            <CardDescription>Extracted by Gemini from the bug replay.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-6 text-sm text-steel-200">
              {job.reproSteps?.map((step, index) => (
                <li key={`step-${index}`}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Tabs defaultValue="test">
          <TabsList>
            <TabsTrigger value="test">Generated Test</TabsTrigger>
            <TabsTrigger value="diff">Patch Diff</TabsTrigger>
            <TabsTrigger value="verify">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Playwright Test</CardTitle>
                <CardDescription>Saved at {job.testFile}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="code-surface overflow-x-auto rounded-2xl p-4 text-xs text-steel-200">
                  <code>{job.testCode || "Test not available."}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diff">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Patch Diff</CardTitle>
                <CardDescription>{job.patchSummary || "Patch proposal"}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="code-surface overflow-x-auto rounded-2xl p-4 text-xs text-steel-200">
                  <code>{job.patchDiff || "Patch diff not available."}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verify">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Verification Results</CardTitle>
                <CardDescription>{job.verify?.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge className={job.verify?.passed ? "bg-emerald-400/20 text-emerald-200" : "bg-amberish-400/20 text-amberish-200"}>
                  {job.verify?.passed ? "PASS" : "FAIL"}
                </Badge>
                <ScrollArea className="h-48 rounded-2xl border border-white/10 bg-ink-900/70 p-3">
                  <pre className="text-xs text-steel-200">{job.verify?.output || "No output"}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Artifacts</CardTitle>
            <CardDescription>Before and after placeholders for UI evidence.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {job.evidence?.beforeImage ? (
              <img className="rounded-3xl border border-white/10" src={job.evidence.beforeImage} alt="Before patch" />
            ) : null}
            {job.evidence?.afterImage ? (
              <img className="rounded-3xl border border-white/10" src={job.evidence.afterImage} alt="After patch" />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
