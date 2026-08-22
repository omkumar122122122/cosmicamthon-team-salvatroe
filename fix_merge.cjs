const fs = require("fs");
const p = "src/pages/ManageVisitRequests.jsx";
let s = fs.readFileSync(p, "utf8");
const hadCRLF = s.includes("\r\n");
let c = hadCRLF ? s.replace(/\r\n/g, "\n") : s;

// Fix: wrap the orphaned JSX after </Card> in a parent div
const old = '        </Card>\n\n            {/* Live Visit Session Timer */}';
const fix = '        </Card>\n\n          <div className="space-y-4">\n            {/* Live Visit Session Timer */}';

if (c.includes(old)) {
  c = c.replace(old, fix);
  console.log("Added opening div");
} else {
  console.log("Pattern not found for opening div");
}

// Now find the end of the component and add closing </div>
// Look for the pattern that ends this section - find "Control Buttons" and trace to the end
// Actually, let's find where the parent component closes and add </div> before it

// Find the closing of the return statement
const closePattern = "          </div>\n        </div>\n      </div>\n    </div>\n  );";
const closeFix = "          </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );";

if (c.includes(closePattern)) {
  c = c.replace(closePattern, closeFix);
  console.log("Added closing div");
} else {
  // Try a different approach - just find the last </div> before );
  const idx = c.lastIndexOf("  );");
  if (idx > 0) {
    // Insert </div> before the last );
    const before = c.substring(0, idx);
    const after = c.substring(idx);
    // Find the last </div> before );
    const lastDiv = before.lastIndexOf("</div>");
    if (lastDiv > 0) {
      c = before.substring(0, lastDiv + 6) + "\n          </div>" + before.substring(lastDiv + 6) + after;
      console.log("Added closing div before );");
    }
  }
}

const out = hadCRLF ? c.replace(/\n/g, "\r\n") : c;
fs.writeFileSync(p, out);
console.log("Done");