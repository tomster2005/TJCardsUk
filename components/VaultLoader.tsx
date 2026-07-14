"use client";

export function VaultLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
      {/* Animated vault icon */}
      <div className="relative mb-6">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.12), rgba(200,155,60,0.04))", border: "1px solid rgba(200,155,60,0.2)" }}>
          <div className="h-5 w-5 rounded-full border-2 border-[rgba(200,155,60,0.3)] border-t-[#c89b3c] animate-spin" />
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: "rgba(200,155,60,0.15)" }} />
      </div>
      <p className="text-[13px] font-medium text-zinc-400">{message}</p>
    </div>
  );
}
