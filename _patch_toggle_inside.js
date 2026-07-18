const fs = require('fs');
const path = 'components/binder/Binder.tsx';
let c = fs.readFileSync(path, 'utf8');

// Remove the external toggle button block (after </button>)
const oldExternal = `                {user && (
                  <button
                    onClick={() => toggleHideSet(s.id)}
                    className="absolute bottom-3 right-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-bold transition"
                    style={{
                      background: isHidden ? "rgba(255,255,255,0.08)" : "rgba(200,155,60,0.15)",
                      border: \`1px solid \${isHidden ? "rgba(255,255,255,0.15)" : "rgba(200,155,60,0.3)"}\`,
                      color: isHidden ? "rgba(255,255,255,0.4)" : "#c89b3c",
                    }}
                  >
                    {isHidden ? "Off" : "Collecting"}
                  </button>
                )}`;

// The inner toggle to insert inside the card, inside relative z-10 div, before closing </div></button>
const newInternalToggle = `                {user && (
                  <button
                    onClick={() => toggleHideSet(s.id)}
                    className="absolute bottom-3 right-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-bold transition"
                    style={{
                      background: isHidden ? "rgba(255,255,255,0.08)" : "rgba(200,155,60,0.15)",
                      border: \`1px solid \${isHidden ? "rgba(255,255,255,0.15)" : "rgba(200,155,60,0.3)"}\`,
                      color: isHidden ? "rgba(255,255,255,0.4)" : "#c89b3c",
                    }}
                    onClickCapture={(e) => { e.stopPropagation(); toggleHideSet(s.id); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isHidden ? "Off" : "Collecting"}
                  </button>
                )}`;

if (!c.includes(oldExternal)) {
  console.error('External toggle block not found');
  process.exit(1);
}

// Remove external block
c = c.replace(oldExternal, '');

// Find the spot just before </div>\n                </button> (closing of relative z-10 p-6 div)
const anchor = '                  </div>\n                </button>';
if (!c.includes(anchor)) {
  console.error('Anchor not found');
  process.exit(1);
}

// Insert the toggle inside the card, before the closing </div></button>
c = c.replace(anchor, `${newInternalToggle}\n${anchor}`);

fs.writeFileSync(path, c, 'utf8');
console.log('Done. Length:', c.length);
