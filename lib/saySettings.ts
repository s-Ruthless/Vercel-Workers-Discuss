/**
 * 说说功能设置管理
 */
import { getSettings, setSetting } from './db.js';

export type SaySettings = {
  sayEnabled: boolean;
  sayAllowComments: boolean;
  sayPageSize: number;
};

const DEFAULTS: SaySettings = {
  sayEnabled: true,
  sayAllowComments: true,
  sayPageSize: 10,
};

const KEYS = {
  enabled: 'say_enabled',
  allowComments: 'say_allow_comments',
  pageSize: 'say_page_size',
} as const;

export async function loadSaySettings(): Promise<SaySettings> {
  const map = await getSettings(Object.values(KEYS));
  return {
    sayEnabled: map.get(KEYS.enabled) !== '0',
    sayAllowComments: map.get(KEYS.allowComments) !== '0',
    sayPageSize: map.get(KEYS.pageSize) ? parseInt(map.get(KEYS.pageSize)!, 10) : DEFAULTS.sayPageSize,
  };
}

export async function saveSaySettings(settings: Partial<SaySettings>): Promise<void> {
  if (settings.sayEnabled !== undefined)
    await setSetting(KEYS.enabled, settings.sayEnabled ? '1' : '0');
  if (settings.sayAllowComments !== undefined)
    await setSetting(KEYS.allowComments, settings.sayAllowComments ? '1' : '0');
  if (settings.sayPageSize !== undefined)
    await setSetting(KEYS.pageSize, String(settings.sayPageSize));
}
