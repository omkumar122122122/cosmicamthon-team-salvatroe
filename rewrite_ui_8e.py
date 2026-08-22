import re

with open('src/pages/AIAttendance.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_ui = '''                      <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-300">
                        {phase8DResult.recognitionStatus === "RECOGNIZED" ? "Phase 8E" : "Phase 8D"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 text-sm">
                    {phase8DResult.recognitionStatus === "RECOGNIZED" ? (
                      <div className="flex flex-col gap-4">
                        {/* Phase 8E Profile Header */}
                        <div className="flex items-start gap-4">
                          <img 
                            src={phase8DResult.child?.photo || "https://ui-avatars.com/api/?name=" + (phase8DResult.child?.fullName || "Child") + "&background=10b981&color=fff"} 
                            alt="Child Profile" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100"
                            onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + (phase8DResult.child?.fullName || "Child") + "&background=10b981&color=fff"; }}
                          />
                          <div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{phase8DResult.child?.fullName}</h4>
                            <p className="text-xs text-slate-500 font-medium">{phase8DResult.child?.registrationNumber} &bull; {phase8DResult.child?.childId}</p>
                            <p className="text-xs text-slate-500">{phase8DResult.child?.age} yrs &bull; {phase8DResult.child?.gender} &bull; {phase8DResult.child?.orphanageName}</p>
                          </div>
                        </div>

                        {/* Phase 8D Analytics */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-slate-500">Similarity Score</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{(phase8DResult.bestSimilarity * 100).toFixed(1)}%</div>
                          
                          <div className="text-slate-500">Confidence Level</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{phase8DResult.confidenceLevel}</div>
                          
                          <div className="text-slate-500">Status</div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">{phase8DResult.recognitionStatus}</div>
                        </div>
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
                  </div>'''

old_ui_re = r'                      <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-\[10px\] font-bold text-\[\#2563EB\] dark:bg-blue-500/10 dark:text-blue-300">\s*Phase 8D\s*</span>\s*</div>\s*</div>\s*<div className="p-4 bg-white dark:bg-slate-900 text-sm">\s*\{phase8DResult\.recognitionStatus === "RECOGNIZED" \? \(\s*<div className="grid grid-cols-2 gap-y-2 gap-x-4">\s*<div className="text-slate-500">Child ID</div>\s*<div className="font-semibold text-slate-800 dark:text-slate-200">\{phase8DResult\.childId\}</div>\s*<div className="text-slate-500">Similarity Score</div>\s*<div className="font-semibold text-slate-800 dark:text-slate-200">\{\(phase8DResult\.bestSimilarity \* 100\)\.toFixed\(1\)\}%</div>\s*<div className="text-slate-500">Confidence Level</div>\s*<div className="font-semibold text-slate-800 dark:text-slate-200">\{phase8DResult\.confidenceLevel\}</div>\s*<div className="text-slate-500">Status</div>\s*<div className="font-semibold text-emerald-600 dark:text-emerald-400">\{phase8DResult\.recognitionStatus\}</div>\s*</div>\s*\) : phase8DResult\.recognitionStatus === "UNKNOWN_FACE" \? \(\s*<div className="text-slate-600 dark:text-slate-400">\s*No matching child found\.\s*</div>\s*\) : \(\s*<div className="text-slate-600 dark:text-slate-400">\s*Unable to confidently identify the child\. <br/>\s*Please look at the camera again\.\s*</div>\s*\)\}\s*</div>'

if re.search(old_ui_re, content):
    content = re.sub(old_ui_re, new_ui, content)
    with open('src/pages/AIAttendance.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Regex match failed")