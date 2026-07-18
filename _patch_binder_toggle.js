const fs = require('fs');
const path = 'components/binder/Binder.tsx';
let content = fs.readFileSync(path, 'utf8');

const marker = '{/* Binder cards */}\n        <div className="mx-auto grid w-full max-w-4xl gap-5 sm:grid-cols-2">\n          {sets.map((s, idx) => (            <button\n              key={s.id}\n              onClick={() => setActiveSetId(s.id)}\n              className="group relative overflow-hidden rounded-2xl text-left transition-all duration-400 hover:-translate-y-2 hover:scale-[1.02]"\n              style={{ animationDelay: `${idx * 100}ms` }}\n            >\n              {/* Card background */}\n              <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #1a0e06 0%, #2d1a0a 30%, #3d2410 60%, #2d1a0a 100%)" }} />\n              {/* Leather texture */}\n              <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "url(\\"data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.15\'/%3E%3C/svg%3E\\")" }} />\n              {/* Gold shimmer on hover */}\n              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.12) 0%, transparent 50%, rgba(200,155,60,0.08) 100%)" }} />\n              {/* Gold border glow on hover */}\n              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 0 1px rgba(200,155,60,0.4), 0 0 30px rgba(200,155,60,0.15)" }} />\n              {/* Default border */}\n              <div className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-400 group-hover:opacity-0" style={{ boxShadow: "inset 0 0 0 1px rgba(200,155,60,0.12)" }} />\n\n              <div className="relative z-10 p-6">\n                {/* Top row */}\n                <div className="flex items-start justify-between">\n                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.2), rgba(200,155,60,0.05))", border: "1px solid rgba(200,155,60,0.25)" }}>\n                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c89b3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">\n                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />\n                    </svg>\n                  </div>\n                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[var(--gold-400)]" style={{ background: "rgba(200,155,60,0.1)", border: "1px solid rgba(200,155,60,0.2)" }}>\n                    {s.total_cards} cards\n                  </span>\n                </div>\n\n                {/* Title */}\n                <h3 className="mt-4 text-xl font-black text-white transition-colors group-hover:text-[var(--gold-300)]">{s.title}</h3>\n                {s.description && <p className="mt-1.5 text-[12px] leading-relaxed text-[rgba(255,255,255,0.45)]">{s.description}</p>}\n\n                {/* Bottom CTA */}\n                <div className="mt-5 flex items-center gap-2 text-[12px] font-bold text-[var(--gold-500)] transition-all duration-300 group-hover:gap-3">\n                  <span>Open binder</span>\n                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">\n                    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>\n                  </svg>\n                </div>\n              </div>\n            </button>\n          ))}\n        </div>';

if (!content.includes(marker)) {
  // Try normalising CRLF
  const norm = content.replace(/\r\n/g, '\n');
  if (!norm.includes(marker)) {
    console.error('NOT FOUND even after normalise');
    process.exit(1);
  }
  content = norm;
}

const replacement = `{/* Binder cards */}
        <div className="mx-auto grid w-full max-w-4xl gap-5 sm:grid-cols-2">
          {sets.map((s, idx) => {
            const isHidden = hiddenSetIds.has(s.id);
            return (
              <div key={s.id} className={\`relative transition-opacity duration-300 \${isHidden ? "opacity-40" : "opacity-100"}\`}>
                <button
                  onClick={() => !isHidden && setActiveSetId(s.id)}
                  className={\`group relative w-full overflow-hidden rounded-2xl text-left transition-all duration-400 \${isHidden ? "cursor-default" : "hover:-translate-y-2 hover:scale-[1.02]"}\`}
                  style={{ animationDelay: \`\${idx * 100}ms\` }}
                >
                  <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #1a0e06 0%, #2d1a0a 30%, #3d2410 60%, #2d1a0a 100%)" }} />
                  <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "url(\\"data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E\\")" }} />
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.12) 0%, transparent 50%, rgba(200,155,60,0.08) 100%)" }} />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100" style={{ boxShadow: "inset 0 0 0 1px rgba(200,155,60,0.4), 0 0 30px rgba(200,155,60,0.15)" }} />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-400 group-hover:opacity-0" style={{ boxShadow: "inset 0 0 0 1px rgba(200,155,60,0.12)" }} />
                  <div className="relative z-10 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.2), rgba(200,155,60,0.05))", border: "1px solid rgba(200,155,60,0.25)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c89b3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[var(--gold-400)]" style={{ background: "rgba(200,155,60,0.1)", border: "1px solid rgba(200,155,60,0.2)" }}>
                        {s.total_cards} cards
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-white transition-colors group-hover:text-[var(--gold-300)]">{s.title}</h3>
                    {s.description && <p className="mt-1.5 text-[12px] leading-relaxed text-[rgba(255,255,255,0.45)]">{s.description}</p>}
                    {isHidden ? (
                      <p className="mt-5 text-[12px] text-[rgba(255,255,255,0.3)]">Not collecting</p>
                    ) : (
                      <div className="mt-5 flex items-center gap-2 text-[12px] font-bold text-[var(--gold-500)] transition-all duration-300 group-hover:gap-3">
                        <span>Open binder</span>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
                {user && (
                  <button
                    onClick={() => toggleHideSet(s.id)}
                    className="absolute right-3 top-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-bold transition"
                    style={{
                      background: isHidden ? "rgba(255,255,255,0.08)" : "rgba(200,155,60,0.15)",
                      border: \`1px solid \${isHidden ? "rgba(255,255,255,0.15)" : "rgba(200,155,60,0.3)"}\`,
                      color: isHidden ? "rgba(255,255,255,0.4)" : "#c89b3c",
                    }}
                  >
                    {isHidden ? "Off" : "Collecting"}
                  </button>
                )}
              </div>
            );
          })}
        </div>`;

content = content.replace(marker, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Done. Length:', content.length);
