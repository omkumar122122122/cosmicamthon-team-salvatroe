const fs = require("fs");
const p = "src/pages/RegisterChild.jsx";
let s = fs.readFileSync(p, "utf8");
const hadCRLF = s.includes("\r\n");
let c = hadCRLF ? s.replace(/\r\n/g, "\n") : s;

// Find the Next Step section and replace it with Phase 6A display
const startMarker = "                              {/* Next Step */}";
const endMarker = "                              </div>\n                            </div>\n                          </div>\n                        )}";

const startIdx = c.indexOf(startMarker);
if (startIdx < 0) {
  console.log("ERROR: Next Step marker not found");
  process.exit(1);
}

// Find the end of the Success Badge div
const successBadgeIdx = c.indexOf("{/* Success Badge */}", startIdx);
if (successBadgeIdx < 0) {
  console.log("ERROR: Success Badge marker not found");
  process.exit(1);
}

// Find the closing </div> after the Success Badge span
const closingDivIdx = c.indexOf("</div>", successBadgeIdx);
if (closingDivIdx < 0) {
  console.log("ERROR: Closing div not found");
  process.exit(1);
}

// The section to replace is from startMarker to closingDivIdx + "</div>".length
const sectionEnd = closingDivIdx + "</div>".length;
const oldSection = c.substring(startIdx, sectionEnd);
console.log("Old section length:", oldSection.length);

const newSection = [
  "                              {/* Phase 6A — Embedding Verification Result */}",
  "                              {phase6ALoading && !phase6AError && (",
  '                                <div className="mt-4 flex flex-col items-center gap-3">',
  '                                  <div className="flex h-7 w-7 items-center justify-center">',
  '                                    <svg className="animate-spin h-6 w-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">',
  '                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>',
  '                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>',
  "                                    </svg>",
  "                                  </div>",
  '                                  <p className="text-xs font-semibold text-emerald-300 font-display">Phase 6A: Generating Face Embeddings\u2026</p>',
  "                                </div>",
  "                              )}",
  "",
  "                              {phase6AError && (",
  '                                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center">',
  '                                  <p className="text-xs font-bold text-red-300">Phase 6A Verification Error</p>',
  '                                  <p className="mt-1 text-[11px] text-red-400/80 break-words">{phase6AError}</p>',
  "                                </div>",
  "                              )}",
  "",
  "                              {phase6AResult && !phase6ALoading && (",
  '                                <div className="mt-4 space-y-2.5">',
  '                                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">',
  '                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-display">Phase 6A Verification</p>',
  '                                    <div className="mt-1.5 grid grid-cols-2 gap-2">',
  '                                      <div><p className="text-[10px] text-slate-400">Images Processed</p><p className="font-extrabold text-white font-display">{phase6AResult.imagesProcessed}</p></div>',
  '                                      <div><p className="text-[10px] text-slate-400">Embeddings Generated</p><p className="font-extrabold text-white font-display">{phase6AResult.embeddingsGenerated}</p></div>',
  '                                      <div><p className="text-[10px] text-slate-400">Failed Images</p><p className="font-extrabold text-red-400 font-display">{phase6AResult.failedImages}</p></div>',
  '                                      <div><p className="text-[10px] text-slate-400">Embedding Dimension</p><p className="font-extrabold text-white font-display">{phase6AResult.embeddingDimension}</p></div>',
  "                                    </div>",
  '                                    <div className="mt-2 flex items-center justify-between">',
  '                                      <span className="text-[10px] text-slate-400 font-medium">Success Rate</span>',
  '                                      <span className="text-xs font-bold text-white font-display">{phase6AResult.successRate}%</span>',
  "                                    </div>",
  "                                  </div>",
  "",
  '                                  <div className="flex items-center justify-center">',
  '                                    <span className={classNames("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold ring-1", phase6AResult.verificationPassed ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40" : "bg-red-500/15 text-red-300 ring-red-400/40")}>',
  '                                      <FiCheckCircle className="h-3 w-3" />',
  '                                      {phase6AResult.verificationPassed ? "PASSED \u2022 Ready for Database Storage (Phase 6B)" : "FAILED \u2022 Review failed images"}',
  "                                    </span>",
  "                                  </div>",
  "",
  '                                  <p className="text-center text-[10px] text-slate-400 break-words">',
  "                                    {phase6AResult.message}",
  "                                  </p>",
  "                                </div>",
  "                              )}",
  "",
  "                              {!phase6ALoading && !phase6AError && !phase6AResult && (",
  '                                <div className="mt-3 flex items-center justify-center">',
  '                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3.5 py-1.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-400/40">',
  '                                    <FiCpu className="h-3 w-3 animate-pulse" /> Starting Phase 6A\u2026',
  "                                  </span>",
  "                                </div>",
  "                              )}",
].join("\n");

c = c.substring(0, startIdx) + newSection + c.substring(sectionEnd);

const out = hadCRLF ? c.replace(/\n/g, "\r\n") : c;
fs.writeFileSync(p, out);

const check = fs.readFileSync(p, "utf8");
console.log("Phase 6A Verification display present:", check.includes("Phase 6A Verification"));
console.log("Next Step removed:", !check.includes("{/* Next Step */}"));