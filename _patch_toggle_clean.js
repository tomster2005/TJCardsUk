const fs = require('fs');
const path = 'components/binder/Binder.tsx';
let c = fs.readFileSync(path, 'utf8');

const start = c.indexOf('                  <div className="relative z-10 p-6">');
const end = c.indexOf('                  </div>\n                </button>', start) + '                  </div>'.length;

if (start === -1 || end === -1) { console.error('Markers not found'); process.exit(1); }

console.log('Replacing chars', start, 'to', end);

const newInner = `                  <div className="relative z-10 p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.2), rgba(200,155,60,0.05))", border: "1px solid rgba(200,155,60,0.25)" }}>
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
                    <div className="mt-5 flex items-center justify-between gap-3">
                      {isHidden ? (
                        <p className="text-[12px] text-[rgba(255,255,255,0.3)]">Not collecting</p>
                      ) : (
                        <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--gold-500)] transition-all duration-300 group-hover:gap-3">
                          <span>Open binder</span>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      {user && (
                        <button
                          onClickCapture={(e) => { e.stopPropagation(); toggleHideSet(s.id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold transition-all"
                          style={{
                            background: isHidden ? "rgba(255,255,255,0.08)" : "rgba(200,155,60,0.15)",
                            border: \`1px solid \${isHidden ? "rgba(255,255,255,0.2)" : "rgba(200,155,60,0.35)"}\`,
                            color: isHidden ? "rgba(255,255,255,0.45)" : "#c89b3c",
                          }}
                        >
                          {isHidden ? "Off" : "Collecting \u2713"}
                        </button>
                      )}
                    </div>
                  </div>`;

c = c.slice(0, start) + newInner + c.slice(end);
fs.writeFileSync(path, c, 'utf8');
console.log('Done. Length:', c.length);
