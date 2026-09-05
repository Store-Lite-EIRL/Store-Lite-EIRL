import fs from 'node:fs';
import path from 'node:path';

interface OgFont {
  name: string;
  data: ArrayBuffer;
  style: 'normal';
  weight: 400 | 700;
}

function loadOgFont(filename: string, name: string, weight: 400 | 700): OgFont | null {
  try {
    const fontPath = path.join(process.cwd(), 'app', 'fonts', filename);
    const buffer = fs.readFileSync(fontPath);
    return {
      name,
      data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      style: 'normal',
      weight,
    };
  } catch {
    return null;
  }
}

/**
 * Loads self-hosted Poppins fonts for OG image generation.
 * Falls back to [] on failure (system font fallback).
 */
export function loadPoppinsFonts(): OgFont[] {
  const regular = loadOgFont('poppins-400.woff2', 'Poppins', 400);
  const bold = loadOgFont('poppins-700.woff2', 'Poppins', 700);
  return [regular, bold].filter(Boolean) as OgFont[];
}
