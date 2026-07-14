"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <div className="rounded-3xl p-14 text-center" style={{ background: "linear-gradient(160deg, #fffdf8, #faf5ed)", border: "1px solid rgba(200,155,60,0.12)" }}>
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-3xl" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.1), rgba(200,155,60,0.03))", border: "1px solid rgba(200,155,60,0.2)", boxShadow: "0 0 20px rgba(200,155,60,0.08)" }}>
        {icon}
      </div>
      <h2 className="text-xl font-black text-zinc-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-500">{description}</p>
      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={a.primary
                ? "btn-gold rounded-full px-6 py-3 text-sm"
                : "rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-6 py-3 text-sm font-semibold text-zinc-600 transition hover:text-zinc-900 hover:border-zinc-300"
              }
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
