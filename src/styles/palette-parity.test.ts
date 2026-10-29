import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type Oklch = { l: number; c: number; h: number };

function parseOklchTokens(block: string): Record<string, Oklch> {
  const tokens: Record<string, Oklch> = {};
  const re =
    /(--(?:color|category)-[\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/[^)]*)?\s*\)/g;
  for (const match of block.matchAll(re)) {
    const key = match[1];
    if (!key) continue;
    tokens[key] = {
      l: Number(match[2]),
      c: Number(match[3]),
      h: Number(match[4]),
    };
  }
  return tokens;
}

const css = readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8');
const light = parseOklchTokens(css.slice(0, css.indexOf('@layer theme')));
const dark = parseOklchTokens(css.slice(css.indexOf('@variant dark')));

describe('light/dark palette parity', () => {
  it('uses the same hues for every shared token', () => {
    const names = Object.keys(light).filter((name) => dark[name]);
    expect(names.length).toBeGreaterThan(20);
    for (const name of names) {
      expect(dark[name]?.h, name).toBe(light[name]?.h);
    }
  });

  it('does not remap a second Tailwind palette in dark', () => {
    expect(css.slice(css.indexOf('@variant dark'))).not.toMatch(
      /--color-(red|emerald|green|blue|amber|yellow|purple|violet)-\d+/
    );
  });
});
