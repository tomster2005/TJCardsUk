export default function ImageQueuePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-bold text-zinc-900">Image Queue</h1>
        <p className="mt-2 text-zinc-600">Manage and process card images for the catalogue.</p>
      </div>

      <div className="rounded-3xl border border-slate-300/60 bg-white/92 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Coming Soon</h2>
            <p className="mt-2 text-zinc-600">
              This feature is under development. You'll be able to manage card images here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
