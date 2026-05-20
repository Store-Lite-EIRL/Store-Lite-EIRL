/**
 * Transform raw PatternCraft data into organized category files.
 *
 * Reads the raw patterns.ts fetched from PatternCraft's GitHub and generates
 * clean TS files in src/data/patterncraft/ organized by category, with `code`
 * field removed and `hasMask` flag added.
 *
 * Uses RAW TEXT transformation — no style object parsing needed.
 */

const fs = require('fs');
const path = require('path');

const RAW_FILE = path.resolve(__dirname, '..', 'raw_patterns.ts');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'data', 'patterncraft');

// ── Tokenizer: extract top-level { } objects from array content ──

function tokenizeArray(arrayContent) {
  const objects = [];
  let i = 0;

  while (i < arrayContent.length) {
    // skip whitespace / commas
    while (i < arrayContent.length && /[\s,]/.test(arrayContent[i])) i++;
    if (i >= arrayContent.length) break;

    if (arrayContent[i] !== '{') {
      i++;
      continue;
    }

    // find matching }
    let depth = 0;
    const start = i;
    while (i < arrayContent.length) {
      const ch = arrayContent[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      } else if (ch === '`') {
        // skip template string
        i++;
        while (i < arrayContent.length) {
          if (arrayContent[i] === '`' && arrayContent[i - 1] !== '\\') break;
          i++;
        }
      } else if (ch === "'") {
        i++;
        while (i < arrayContent.length) {
          if (arrayContent[i] === '\\') {
            i += 2;
            continue;
          }
          if (arrayContent[i] === "'") break;
          i++;
        }
      } else if (ch === '"') {
        i++;
        while (i < arrayContent.length) {
          if (arrayContent[i] === '\\') {
            i += 2;
            continue;
          }
          if (arrayContent[i] === '"') break;
          i++;
        }
      }
      i++;
    }

    objects.push(arrayContent.slice(start, i));
  }

  return objects;
}

// ── Field extraction helpers ──

function extractSimpleString(text, fieldName) {
  const re = new RegExp(`${fieldName}:\\s*['"]([^'"]+)['"]`);
  const m = text.match(re);
  return m ? m[1] : null;
}

function stripCodeField(text) {
  // Remove `code: backtick-string` from the pattern text.
  // Find "code:" then skip the backtick string.
  const idx = text.search(/code:\s*`/);
  if (idx === -1) return text;

  let i = idx;
  // skip "code: `"
  while (i < text.length && text[i] !== '`') i++;
  i++; // skip opening backtick

  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2;
      continue;
    }
    if (text[i] === '`') break; // closing backtick
    i++;
  }
  i++; // skip closing backtick

  // Remove the comma before "code:" if present
  const beforeCode = text.slice(0, idx).replace(/,\s*$/, '');
  const afterCode = text.slice(i);

  return beforeCode + afterCode;
}

function hasMaskInStyle(text) {
  // Check if the style block contains maskImage or WebkitMaskImage
  const styleMatch = text.match(/style:\s*\{([\s\S]*?)\}(?=\s*[,}\]])/);
  if (!styleMatch) return false;
  const styleContent = styleMatch[1];
  return /\b(maskImage|WebkitMaskImage)\b/.test(styleContent);
}

function extractStyleText(text) {
  const styleMatch = text.match(/style:\s*(\{[\s\S]*?\})(?=\s*[,}\]])/);
  return styleMatch ? styleMatch[1] : null;
}

function hasAnimation(text) {
  const styleText = extractStyleText(text);
  if (!styleText) return false;
  return /\b(animation|transition)\b/.test(styleText);
}

// ── Output formatting ──

function formatPatternObject(rawText, hasMask, anim) {
  // Add hasMask field after the opening brace
  let result = rawText.replace(/\{([\s\S]*?)(\n\s*id:)/, (match, before, idLine) => {
    return '{' + before + idLine;
  });

  // Insert hasMask before 'style:'
  result = result.replace(/(\n\s*)(style:)/, `$1hasMask: ${hasMask},$1$1$2`);

  // Clean up trailing comma before closing brace
  result = result.replace(/,\s*\n\s*\}[\s,]*$/, '\n}');

  return result;
}

// ── Main ──

function main() {
  console.log('Reading raw data...');
  const raw = fs.readFileSync(RAW_FILE, 'utf-8');

  // Find array content
  const marker = 'export const gridPatterns: Pattern[] = [';
  const start = raw.indexOf(marker) + marker.length;
  if (start < marker.length) throw new Error('Could not find gridPatterns array');

  // Find matching ] of the array
  let depth = 1;
  let inTmpl = false;
  let inStr = false;
  let strCh = '';
  let end = start;

  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    const p = i > 0 ? raw[i - 1] : '';

    if (inTmpl) {
      if (c === '`' && p !== '\\') inTmpl = false;
    } else if (inStr) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === strCh) inStr = false;
    } else {
      if (c === '`') inTmpl = true;
      else if (c === "'") {
        inStr = true;
        strCh = "'";
      } else if (c === '"') {
        inStr = true;
        strCh = '"';
      } else if (c === '[') depth++;
      else if (c === ']') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
  }

  const arrayContent = raw.slice(start + 1, end);
  console.log(`Array content: ${arrayContent.length} chars`);

  const objects = tokenizeArray(arrayContent);
  console.log(`Found ${objects.length} pattern objects`);

  // Transform each object
  const byCategory = {};

  for (const objText of objects) {
    const id = extractSimpleString(objText, 'id');
    const category = extractSimpleString(objText, 'category');
    if (!id || !category) {
      console.log(`  ⚠ Skipping pattern: id=${id}, cat=${category}`);
      continue;
    }

    const textNoCode = stripCodeField(objText);
    const mask = hasMaskInStyle(textNoCode);
    const anim = hasAnimation(textNoCode);

    // Insert hasMask before style:
    const withMask = textNoCode.replace(/(\s*)(style\s*:)/, `$1hasMask: ${mask},$1$2`);

    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push({ id, raw: withMask });
  }

  console.log(
    'Category distribution:',
    Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
  );

  // Write output
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Types
  const typesContent = `export interface PatternCraftStyle {
  /** Base background color or gradient */
  background?: string;
  backgroundColor?: string;
  /** CSS background-image value */
  backgroundImage?: string;
  /** CSS background-size value */
  backgroundSize?: string;
  /** CSS background-position value */
  backgroundPosition?: string;
  backgroundRepeat?: string;
  /** Mask properties — for future use (V2 mask support) */
  maskImage?: string;
  WebkitMaskImage?: string;
  maskComposite?: string;
  WebkitMaskComposite?: string;
  maskSize?: string;
  WebkitMaskSize?: string;
  maskPosition?: string;
  WebkitMaskPosition?: string;
  maskRepeat?: string;
  WebkitMaskRepeat?: string;
}

export type PatternCraftCategory = 'gradients' | 'geometric' | 'decorative' | 'effects';

export interface PatternCraftPattern {
  id: string;
  name: string;
  category: PatternCraftCategory;
  badge?: string;
  description?: string;
  hasMask: boolean;
  style: PatternCraftStyle;
}
`;
  fs.writeFileSync(path.join(OUT_DIR, 'types.ts'), typesContent);
  console.log('✓ Written types.ts');

  // Category files
  const categoryNames = {
    decorative: 'Decorative',
    geometric: 'Geometric',
    gradients: 'Gradients',
    effects: 'Effects',
  };

  for (const [cat, items] of Object.entries(byCategory)) {
    const label = categoryNames[cat] || cat;
    const sorted = items.sort((a, b) => a.id.localeCompare(b.id));

    const lines = [
      `import type { PatternCraftPattern } from './types';\n`,
      `/**\n * ${label} patterns from PatternCraft.\n * Auto-generated from PatternCraft data.\n */`,
      `export const ${cat}Patterns: PatternCraftPattern[] = [`,
    ];

    for (const item of sorted) {
      lines.push(item.raw + ',');
    }

    lines.push('];\n');

    fs.writeFileSync(path.join(OUT_DIR, `${cat}.ts`), lines.join('\n'));
    console.log(`✓ Written ${cat}.ts (${items.length} patterns)`);
  }

  // Index
  const indexContent = `export type { PatternCraftPattern, PatternCraftStyle, PatternCraftCategory } from './types';
export { gradientsPatterns } from './gradients';
export { geometricPatterns } from './geometric';
export { decorativePatterns } from './decorative';
export { effectsPatterns } from './effects';

import type { PatternCraftPattern } from './types';
import { gradientsPatterns } from './gradients';
import { geometricPatterns } from './geometric';
import { decorativePatterns } from './decorative';
import { effectsPatterns } from './effects';

/** All patterns from PatternCraft, organized by category. */
export const patternCraftByCategory: Record<string, PatternCraftPattern[]> = {
  gradients: gradientsPatterns,
  geometric: geometricPatterns,
  decorative: decorativePatterns,
  effects: effectsPatterns,
};

/** Flat list of all PatternCraft patterns. */
export const allPatternCraftPatterns: PatternCraftPattern[] = [
  ...gradientsPatterns,
  ...geometricPatterns,
  ...decorativePatterns,
  ...effectsPatterns,
];

/** Look up a PatternCraft pattern by its ID. */
export function getPatternCraftById(id: string): PatternCraftPattern | undefined {
  return allPatternCraftPatterns.find((p) => p.id === id);
}
`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), indexContent);
  console.log('✓ Written index.ts');

  // Verify
  const summary = Object.entries(byCategory)
    .map(([cat, items]) => `  ${cat}: ${items.length}`)
    .join('\n');
  console.log(`\nDone! Generated:\n${summary}`);
}

main();
