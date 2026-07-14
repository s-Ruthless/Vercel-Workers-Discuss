/**
 * 表情数据生成
 * 自动扫描 public/emotion 目录生成 OwO.json
 */
import fs from 'fs';
import path from 'path';

export function generateOwoData(emotionDir: string): Record<string, any> {
  const result: Record<string, any> = {};

  // 1. 颜文字
  const emoticonsPath = path.join(emotionDir, 'emoticons.json');
  if (fs.existsSync(emoticonsPath)) {
    const emoticons = JSON.parse(fs.readFileSync(emoticonsPath, 'utf-8'));
    result['颜文字'] = { type: 'text', container: emoticons };
  }

  // 2. 图片表情包
  const entries = fs.readdirSync(emotionDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgDir = path.join(emotionDir, entry.name);
    const metaPath = path.join(pkgDir, 'meta.json');

    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const items = meta.items || {};
    const container = Object.entries(items).map(([icon, text]) => ({ icon, text }));

    result[meta.displayName || entry.name] = {
      type: 'image',
      name: entry.name,
      container,
    };
  }

  return result;
}
