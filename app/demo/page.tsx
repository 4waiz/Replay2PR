import BuggyForm from "./buggy-form";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sticker">
            🎮 Demo Target - Replay2PR
          </div>
          <BuggyForm />
        </div>
        <aside className="rounded-[28px] border-2 border-ink/10 bg-white/90 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-ink">Bug Context</h3>
          <p className="mt-2 text-sm text-muted">
            The success banner should appear after submit, but the handler keeps the form in Draft state.
            Use this page to verify the generated Playwright test and patch flow.
          </p>
          <div className="mt-6 space-y-4 text-sm">
            <div className="rounded-[18px] border-2 border-ink/10 bg-hero-lime bg-cover p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Expected</div>
              <div className="text-ink">Status flips to Sent and a success banner renders.</div>
            </div>
            <div className="rounded-[18px] border-2 border-ink/10 bg-hero-pink bg-cover p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Actual</div>
              <div className="text-ink">Status returns to Draft. Banner never appears.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
