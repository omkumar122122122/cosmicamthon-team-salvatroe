import re

with open('src/services/faceDetectionService.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_log_block = '''  if (data.recognitionStatus === "RECOGNIZED") {
    console.log(Confidence : );
    console.log("Ready For Attendance");
    console.log("Phase 8D PASSED");
    
    console.log("");
    console.log("[Phase 8E]");
    console.log("Fetching Child Profile...");
    if (data.child) {
        console.log("Child Found");
        console.log("Profile Loaded");
        console.log("Ready For Attendance");
        console.log("Phase 8E PASSED");
    } else {
        console.log("Phase 8E FAILED");
    }
  } else if (data.recognitionStatus === "UNKNOWN_FACE") {'''

old_log_block_re = r'  if \(data\.recognitionStatus === "RECOGNIZED"\) \{\s*console\.log\(Confidence : \$\{data\.confidenceLevel\}\);\s*console\.log\("Ready For Attendance"\);\s*console\.log\("Phase 8D PASSED"\);\s*\} else if \(data\.recognitionStatus === "UNKNOWN_FACE"\) \{'

content = re.sub(old_log_block_re, new_log_block, content)

with open('src/services/faceDetectionService.js', 'w', encoding='utf-8') as f:
    f.write(content)