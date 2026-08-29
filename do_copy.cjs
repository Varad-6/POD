const fs = require('fs');
const path = require('path');
const target = 'C:\\Users\\Varad\\Documents\\GitHub\\POD\\src\\views\\TransporterPOs.tsx';
const src = 'C:\\Users\\Varad\\Documents\\GitHub\\POD\\TransporterPOs_new.tsx';
if (fs.existsSync(src)) {
  fs.copyFileSync(src, target);
  console.log('Copied successfully');
} else {
  console.log('Source not found');
}
