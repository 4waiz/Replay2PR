export type StepId = "extract" | "reproduce" | "patch" | "verify" | "ship";
export type StepStatus = "pending" | "running" | "success" | "error" | "skipped";
export type JobStatus = "queued" | "running" | "success" | "error";

export interface JobStep {
  id: StepId;
  title: string;
  status: StepStatus;
  startedAt?: string;
  endedAt?: string;
  logs: string[];
  summary?: string;
  artifacts?: Record<string, string>;
}

export interface JobData {
  id: string;
  mode: "demo" | "repo";
  repoUrl?: string;
  uploadId: string;
  uploadFilename?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  steps: JobStep[];
  reproSteps?: string[];
  testFile?: string;
  testCode?: string;
  patchDiff?: string;
  patchSummary?: string;
  verify?: {
    passed: boolean;
    summary: string;
    output: string;
  };
  evidence?: {
    beforeImage?: string;
    afterImage?: string;
  };
  shareUrl: string;
}
