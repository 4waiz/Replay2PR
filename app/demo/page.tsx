import BuggyForm from "./buggy-form";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-ink-900 text-steel-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <div className="flex-1">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-steel-200">
            Demo Target - Replay2PR
          </div>
          <BuggyForm />
        </div>
        <aside className="glass w-full max-w-md rounded-3xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-white">Bug Context</h3>
          <p className="mt-2 text-sm text-steel-300">
            The success banner should appear after submit, but the handler keeps the form in Draft state.
            Use this page to verify the generated Playwright test and patch flow.
          </p>
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-steel-400">Expected</div>
              <div className="text-steel-100">Status flips to Sent and a success banner renders.</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-steel-400">Actual</div>
              <div className="text-steel-100">Status returns to Draft. Banner never appears.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
