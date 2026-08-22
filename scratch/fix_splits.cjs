const fs = require('fs');
const path = require('path');
const dir = 'src/pages';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (f.endsWith('.jsx')) {
    const p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf8');
    
    // Safely fix name.split(" ")
    c = c.replace(/([a-zA-Z0-9_]+)\.name\.split\(['"] ['"]\)/g, '($1.name || "").split(" ")');
    c = c.replace(/([a-zA-Z0-9_]+)\.childName\.split\(['"] ['"]\)/g, '($1.childName || "").split(" ")');
    c = c.replace(/fullName\.split\(['"] ['"]\)/g, '(fullName || "").split(" ")');
    
    // Fix map of potentially undefined arrays
    c = c.replace(/\(orphanage\.facilities \?\? \["Not provided"\]\)\.map/g, '((orphanage?.facilities || []).length ? orphanage.facilities : ["Not provided"]).map');
    
    fs.writeFileSync(p, c);
  }
});
console.log('Fixed split and map vulnerabilities');
