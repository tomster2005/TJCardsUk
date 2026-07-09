type SectionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

export function SectionCard({ title, description, children, icon }: SectionCardProps) {
  return (
    <section className="group rounded-3xl border border-slate-300/50 bg-white/90 p-8 shadow-[0_16px_34px_rgba(15,23,42,0.08)] card-lift">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-zinc-900 sm:text-2xl">
            {icon ? <span className="text-zinc-500 transition-transform duration-300 group-hover:scale-110">{icon}</span> : null}
            {title}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
