/**
 * 表情数据生成 (Waline 风格 info.json 格式)
 * 自动扫描 emotion 目录，为每个表情包生成 info.json
 */
import fs from 'fs';
import path from 'path';

export function generateInfoJson(emotionDir: string): void {
  const entries = fs.readdirSync(emotionDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgDir = path.join(emotionDir, entry.name);
    const metaPath = path.join(pkgDir, 'meta.json');

    // 如果已有 info.json 则跳过
    const infoPath = path.join(pkgDir, 'info.json');
    if (fs.existsSync(infoPath)) continue;

    if (!fs.existsSync(metaPath)) continue;

    // 从旧版 meta.json 生成 info.json
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const items = meta.items || {};
    const itemNames = Object.keys(items);

    const info = {
      name: meta.displayName || entry.name,
      prefix: `${entry.name}_`,
      type: 'png',
      icon: itemNames[0] || '',
      items: itemNames,
    };

    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8');
    console.log(`[emotion] Generated info.json for ${entry.name}`);
  }
}
