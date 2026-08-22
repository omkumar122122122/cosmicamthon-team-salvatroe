const fs = require('fs');
const path = require('path');
const dir = 'src/services';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (f.endsWith('.js') && f !== 'apiClient.js') {
    const p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/import apiClient from ['"]\.\/apiClient['"];/g, "import { apiClient } from './apiClient';");
    c = c.replace(/import api from ['"]\.\/apiClient['"];/g, "import { apiClient as api } from './apiClient';");
    c = c.replace(/import api from ['"]\.\/api['"];/g, "import { apiClient as api } from './apiClient';");
    fs.writeFileSync(p, c);
  }
});
console.log('Fixed imports in services');
