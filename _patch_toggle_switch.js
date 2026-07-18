const fs = require('fs');
const path = 'components/binder/Binder.tsx';
let c = fs.readFileSync(path, 'utf8');

const oldToggle = `                      {user && (
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
                      )}`;

if (!c.includes(oldToggle)) {
  console.error('NOT FOUND');
  process.exit(1);
}

const newToggle = `                      {user && (
                        <button
                          onClickCapture={(e) => { e.stopPropagation(); toggleHideSet(s.id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex shrink-0 items-center gap-1.5"
                          title={isHidden ? "Click to start collecting" : "Click to stop collecting"}
                        >
                          <span className="text-[10px] font-semibold" style={{ color: isHidden ? "rgba(255,255,255,0.3)" : "#c89b3c" }}>
                            {isHidden ? "Off" : "Collecting"}
                          </span>
                          <div
                            className="relative h-5 w-9 rounded-full transition-all duration-300"
                            style={{ background: isHidden ? "rgba(255,255,255,0.1)" : "rgba(200,155,60,0.35)", border: \`1px solid \${isHidden ? "rgba(255,255,255,0.15)" : "rgba(200,155,60,0.5)"}\` }}
                          >
                            <div
                              className="absolute top-0.5 h-4 w-4 rounded-full transition-all duration-300"
                              style={{ left: isHidden ? "2px" : "calc(100% - 18px)", background: isHidden ? "rgba(255,255,255,0.3)" : "#c89b3c", boxShadow: isHidden ? "none" : "0 0 6px rgba(200,155,60,0.6)" }}
                            />
                          </div>
                        </button>
                      )}`;

c = c.replace(oldToggle, newToggle);
fs.writeFileSync(path, c, 'utf8');
console.log('Done. Length:', c.length);
