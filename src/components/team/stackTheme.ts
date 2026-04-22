import type { ReactNode } from 'react';
import { createElement } from 'react';
import {
  IconBrandReact,
  IconBrandNodejs,
  IconBrandAngular,
  IconBrandVue,
  IconBrandPython,
  IconBrandJavascript,
  IconBrandTypescript,
  IconBrandPhp,
  IconBrandGolang,
  IconBrandCSharp,
  IconBrandDjango,
  IconBrandFlutter,
  IconBrandKotlin,
  IconBrandSwift,
  IconCoffee,
  IconCode,
  IconDatabase,
  IconCloudCode,
} from '@tabler/icons-react';

export interface StackTheme {
  color: string;
  dark: string;
  bg: string;
  border: string;
  hoverBg: string;
  gradient: string;
  icon: ReactNode;
}

// FNV-1a hash — stable, same string → same number
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) | 0;
  }
  return h >>> 0;
}

/** Split a comma-or-pipe-or-slash separated stack string into individual techs. */
export function parseStackList(stack?: string): string[] {
  if (!stack) return [];
  return stack
    .split(/[,/|&+]|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Returns the appropriate tabler icon for a known stack name. */
export function getStackIcon(stack: string, size = 16): ReactNode {
  const key = stack.toLowerCase();
  const props = { size };
  if (key.includes('react')) return createElement(IconBrandReact, props);
  if (key.includes('node')) return createElement(IconBrandNodejs, props);
  if (key.includes('angular')) return createElement(IconBrandAngular, props);
  if (key.includes('vue')) return createElement(IconBrandVue, props);
  if (key.includes('django')) return createElement(IconBrandDjango, props);
  if (key.includes('python')) return createElement(IconBrandPython, props);
  if (key.includes('typescript') || key === 'ts') return createElement(IconBrandTypescript, props);
  if (key.includes('javascript') || key === 'js') return createElement(IconBrandJavascript, props);
  if (key.includes('java') && !key.includes('script'))
    return createElement(IconCoffee, props);
  if (key.includes('php')) return createElement(IconBrandPhp, props);
  if (key.includes('ruby')) return createElement(IconCode, props);
  if (key.includes('go') && key.length < 14)
    return createElement(IconBrandGolang, props);
  if (key.includes('.net') || key.includes('c#') || key.includes('csharp'))
    return createElement(IconBrandCSharp, props);
  if (key.includes('kotlin')) return createElement(IconBrandKotlin, props);
  if (key.includes('swift')) return createElement(IconBrandSwift, props);
  if (key.includes('flutter')) return createElement(IconBrandFlutter, props);
  if (
    key.includes('sql') ||
    key.includes('mongo') ||
    key.includes('postgres') ||
    key.includes('mysql') ||
    key.includes('database') ||
    key.includes('db')
  )
    return createElement(IconDatabase, props);
  if (
    key.includes('aws') ||
    key.includes('azure') ||
    key.includes('cloud') ||
    key.includes('gcp')
  )
    return createElement(IconCloudCode, props);
  return createElement(IconCode, props);
}

/** Returns a stable color theme for a given stack name. */
export function getStackTheme(stack: string, size = 16): StackTheme {
  const key = stack.trim().toLowerCase() || 'default';
  const hue = key ? (hashString(key) % 325) + 16 : 215;
  const hue2 = (hue + 28) % 360;
  return {
    color: `hsl(${hue}, 68%, 48%)`,
    dark: `hsl(${hue}, 72%, 32%)`,
    bg: `hsla(${hue}, 68%, 48%, 0.08)`,
    border: `hsla(${hue}, 68%, 48%, 0.22)`,
    hoverBg: `hsla(${hue}, 68%, 48%, 0.14)`,
    gradient: `linear-gradient(135deg, hsl(${hue}, 72%, 52%) 0%, hsl(${hue2}, 68%, 62%) 100%)`,
    icon: getStackIcon(stack, size),
  };
}
