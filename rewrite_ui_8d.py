import re

with open('src/pages/AIAttendance.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

phase8d_ui = '''
            {/* Phase 8D Result UI */}
            <AnimatePresence>
              {phase8DResult && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden rounded-xl border bg-white dark:bg-slate-900 shadow-sm"
                  style={{
                    borderColor: phase8DResult.recognitionStatus === "RECOGNIZED"
                      ? "rgba(16,185,129,0.3)"
                      : phase8DResult.recognitionStatus === "UNKNOWN_FACE"
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(245,158,11,0.3)"
                  }}
                >
                  <div className={p-4 border-b }>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {phase8DResult.recognitionStatus === "RECOGNIZED" ? (
                          <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : phase8DResult.recognitionStatus === "UNKNOWN_FACE" ? (
                          <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <FiRefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        )}
                        <h3 className={ont-semibold }>
                          {phase8DResult.recognitionStatus === "RECOGNIZED" ? "Child Recognized" :
                           phase8DResult.recognitionStatus === "UNKNOWN_FACE" ? "Unknown Face" :
                           "Ambiguous Match"}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-300">
                        Phase 8D
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 text-sm">
                    {phase8DResult.recognitionStatus === "RECOGNIZED" ? (
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="text-slate-500">Child ID</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{phase8DResult.childId}</div>
                        
                        <div className="text-slate-500">Similarity Score</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{(phase8DResult.bestSimilarity * 100).toFixed(1)}%</div>
                        
                        <div className="text-slate-500">Confidence Level</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{phase8DResult.confidenceLevel}</div>
                        
                        <div className="text-slate-500">Status</div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">{phase8DResult.recognitionStatus}</div>
                      </div>
                    ) : phase8DResult.recognitionStatus === "UNKNOWN_FACE" ? (
                      <div className="text-slate-600 dark:text-slate-400">
                        No matching child found.
                      </div>
                    ) : (
                      <div className="text-slate-600 dark:text-slate-400">
                        Unable to confidently identify the child. <br/>
                        Please look at the camera again.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
'''

# Find the AnimatePresence block for Phase 8A and insert this right after it
old_ui_re = r'(</AnimatePresence>)'

if re.search(old_ui_re, content):
    content = re.sub(old_ui_re, r'\1\n' + phase8d_ui, content, count=1)
    
with open('src/pages/AIAttendance.jsx', 'w', encoding='utf-8') as f:
    f.write(content)