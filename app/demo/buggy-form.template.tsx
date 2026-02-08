"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function BuggyForm() {
  const [name, setName] = useState("");
  const [issue, setIssue] = useState("");
  const [steps, setSteps] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("Draft");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("Sending");

    setTimeout(() => {
      // BUG: should setSubmitted(true) and status to Sent.
      setSubmitted(false);
      setStatus("Draft");
    }, 350);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Replay Incident Report</h2>
          <p className="text-sm text-steel-300">File a quick report to reproduce the bug.</p>
        </div>
        <Badge data-testid="status-chip" variant={submitted ? "success" : "default"}>
          {submitted ? "Sent" : status}
        </Badge>
      </div>

      {submitted ? (
        <div
          data-testid="success-banner"
          className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
        >
          Report sent to the Replay pipeline.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-steel-300">Reporter</label>
            <Input
              data-testid="name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ava Pilot"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-steel-300">Issue ID</label>
            <Input
              data-testid="issue-input"
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
              placeholder="RPL-102"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-steel-300">Steps Captured</label>
          <Textarea
            data-testid="steps-input"
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
            placeholder="Click submit, no success banner..."
          />
        </div>

        <Button type="submit" data-testid="submit-button" className="w-full">
          Send Replay Report
        </Button>
      </form>
    </div>
  );
}
