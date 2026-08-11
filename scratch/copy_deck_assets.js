import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('public/screenshots');
const distScreenshotsDir = path.resolve('dist/screenshots');
const publicScreenshotsDir = path.resolve('public/screenshots');

if (!fs.existsSync(distScreenshotsDir)) {
  fs.mkdirSync(distScreenshotsDir, { recursive: true });
}

// Copy screenshots to dist/screenshots
const files = fs.readdirSync(srcDir);
files.forEach((f) => {
  fs.copyFileSync(path.join(srcDir, f), path.join(distScreenshotsDir, f));
});

// Copy production_pitch_deck.html to dist/
fs.copyFileSync(path.resolve('production_pitch_deck.html'), path.resolve('dist/production_pitch_deck.html'));
fs.copyFileSync(path.resolve('production_pitch_deck.html'), path.resolve('public/production_pitch_deck.html'));

console.log('SUCCESS: Copied deck and screenshots to dist/ and public/');
