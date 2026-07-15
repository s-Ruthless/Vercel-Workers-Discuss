/**
 * 构建脚本：将 emotion 表情资源复制到 public 目录
 * Admin 前端由 Vite 直接构建到 ../public/admin/ 目录，无需额外复制
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EMOTION_SRC = path.resolve(ROOT, 'emotion');
const EMOTION_DEST = path.resolve(ROOT, 'public', 'emotion');

const EXCLUDE_FILES = new Set([
  'OwO.min.js',
  'generate-owo.cjs',
  'meta.json',
]);

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
]);

function copyDir(src, dest, excludeFiles = new Set(), excludeDirs = new Set()) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) continue;
      copyDir(srcPath, destPath, excludeFiles, excludeDirs);
    } else {
      if (excludeFiles.has(entry.name)) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function generateOwoJson(emotionDir, outputPath) {
  const result = {};

  // 颜文字
  const emoticonsPath = path.join(emotionDir, 'emoticons.json');
  if (fs.existsSync(emoticonsPath)) {
    const emoticons = JSON.parse(fs.readFileSync(emoticonsPath, 'utf-8'));
    result['颜文字'] = { type: 'text', container: emoticons.container || emoticons };
  }

  // 图片表情包
  const entries = fs.readdirSync(emotionDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgDir = path.join(emotionDir, entry.name);
    const metaPath = path.join(pkgDir, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const items = meta.items || {};
    const container = Object.entries(items).map(([icon, text]) => ({ icon, text }));
    result[meta.displayName || entry.name] = { type: 'image', name: entry.name, container };
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log('[emotion] OwO.json generated');
}

function run() {
  console.log('=== VWD Vercel Build ===');

  // Copy emotion assets (including info.json for each pack)
  if (fs.existsSync(EMOTION_SRC)) {
    console.log('[emotion] Copying to public/emotion/');
    if (fs.existsSync(EMOTION_DEST)) {
      fs.rmSync(EMOTION_DEST, { recursive: true });
    }
    copyDir(EMOTION_SRC, EMOTION_DEST, EXCLUDE_FILES, EXCLUDE_DIRS);
    // Generate OwO.json (for backward compatibility with old vwd.js)
    generateOwoJson(EMOTION_SRC, path.join(EMOTION_DEST, 'OwO.json'));
    console.log('[emotion] Done');
  } else {
    console.warn('[emotion] emotion directory not found, skipping');
  }

  console.log('=== Build complete ===');
}

run();
