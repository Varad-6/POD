import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('public/screenshots');
const artifactDir = 'C:\\Users\\Varad\\.gemini\\antigravity-cli\\brain\\7de90c53-5305-40d2-ac87-3c2fc4152fd4\\screenshots';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach((f) => {
  fs.copyFileSync(path.join(srcDir, f), path.join(artifactDir, f));
});

console.log('SUCCESS: Copied screenshots to artifacts directory!');
