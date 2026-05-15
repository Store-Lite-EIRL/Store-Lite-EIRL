import type { ExcelRow, RawSheetInfo } from './ExcelParser';

/* ───────────────────── Types ───────────────────── */

export type MatchType = 'exact' | 'partial' | 'sheet' | 'not_found' | 'default';

export interface ColumnMapping {
  field: string;
  label: string;
  originalHeader: string | null;
  matchType: MatchType;
  inferredType: string;
  confidence: number;
  warnings: string[];
  sampleValues: string[];
  required: boolean;
}

export interface Anomaly {
  type:
    | 'missing_title'
    | 'title_truncated'
    | 'invalid_price'
    | 'negative_stock'
    | 'stock_as_text'
    | 'missing_image'
    | 'duplicate_title'
    | 'empty_row';
  severity: 'error' | 'warning' | 'info';
  label: string;
  count: number;
  description: string;
  sampleRows: number[];
}

export interface SummaryStats {
  totalRows: number;
  totalSheets: number;
  categories: { name: string; count: number }[];
  priceRange: { min: number; max: number } | null;
  stockTotal: number;
  productsWithoutStock: number;
  productsWithoutTitle: number;
  productsWithImage: number;
}

export interface DataQualityReport {
  columns: ColumnMapping[];
  anomalies: Anomaly[];
  summary: SummaryStats;
  qualityScore: number;
}

/* ──────── Field descriptors ──────── */

interface FieldDef {
  field: string;
  label: string;
  possibleNames: string[];
  required: boolean;
}

const EXPECTED_FIELDS: FieldDef[] = [
  {
    field: 'image',
    label: 'Imagen',
    possibleNames: [
      'image',
      'imagen',
      'foto',
      'photo',
      'url',
      'img',
      'pic',
      'picture',
      'link',
      'enlace',
      'src',
    ],
    required: false,
  },
  {
    field: 'title',
    label: 'Producto',
    possibleNames: ['Title', 'titulo', 'nombre', 'name', 'producto'],
    required: true,
  },
  {
    field: 'description',
    label: 'Descripción',
    possibleNames: ['description', 'descripcion', 'desc', 'detalle'],
    required: false,
  },
  {
    field: 'category',
    label: 'Categoría',
    possibleNames: ['categoria', 'category', 'categoría', 'CATEGORIA'],
    required: false,
  },
  { field: 'brand', label: 'Marca', possibleNames: ['brand', 'marca', 'MARCA'], required: false },
  {
    field: 'stock',
    label: 'Stock',
    possibleNames: ['stock', 'cantidad', 'qty', 'inventario'],
    required: true,
  },
  { field: 'price', label: 'Precio', possibleNames: ['price', 'precio', 'costo'], required: true },
];

/* ──────── Helpers ──────── */

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function findHeaderMatch(
  rawHeaders: string[],
  possibleNames: string[],
): { match: string | null; matchType: MatchType } {
  const normNames = possibleNames.map(normalize);
  const normHeaders = rawHeaders.map(normalize);

  // 1. Exact match
  for (let i = 0; i < normHeaders.length; i++) {
    if (normNames.includes(normHeaders[i])) {
      return { match: rawHeaders[i], matchType: 'exact' };
    }
  }

  // 2. Partial match (one contains the other)
  for (let i = 0; i < normHeaders.length; i++) {
    if (normNames.some((n) => normHeaders[i].includes(n) || n.includes(normHeaders[i]))) {
      return { match: rawHeaders[i], matchType: 'partial' };
    }
  }

  return { match: null, matchType: 'not_found' };
}

function inferType(values: unknown[]): string {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '' && v !== 0);
  if (nonEmpty.length === 0) return 'Vacío';

  // Check if ALL values are numeric
  const allNumeric = nonEmpty.every((v) => {
    if (typeof v === 'number') return true;
    if (typeof v === 'string') return /^-?\d+(\.\d+)?$/.test(v.trim());
    return false;
  });
  if (allNumeric) return 'Número';

  // Check if looks like a URL
  const allUrls = nonEmpty.every((v) => {
    const s = String(v).trim().toLowerCase();
    return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/');
  });
  if (allUrls) return 'URL';

  // Check if mostly numeric with some currency symbols
  const numericCount = nonEmpty.filter((v) => {
    const s = String(v)
      .trim()
      .replace(/[$,S/.\s]/g, '');
    return /^-?\d+(\.\d+)?$/.test(s);
  }).length;
  if (numericCount > nonEmpty.length * 0.7) return 'Moneda';

  return 'Texto';
}

function detectDuplicateTitles(rows: ExcelRow[]): { title: string; indices: number[] }[] {
  const map = new Map<string, number[]>();
  rows.forEach((r, i) => {
    if (!r.title) return;
    const existing = map.get(r.title.toLowerCase().trim()) ?? [];
    existing.push(i);
    map.set(r.title.toLowerCase().trim(), existing);
  });
  return Array.from(map.entries())
    .filter(([, indices]) => indices.length > 1)
    .map(([title, indices]) => ({ title, indices }));
}

/* ──────── Main analyzer ──────── */

export function analyzeDataQuality(
  data: Record<string, ExcelRow[]>,
  sheetInfo: RawSheetInfo[],
): DataQualityReport {
  // Flatten all rows
  const allRows: ExcelRow[] = Object.values(data).flat();

  // Collect all unique raw headers across all sheets
  const allRawHeaders = Array.from(new Set(sheetInfo.flatMap((s) => s.rawHeaders)));

  // ── Column mapping analysis ──
  const columns: ColumnMapping[] = EXPECTED_FIELDS.map((field) => {
    const { match, matchType } = findHeaderMatch(allRawHeaders, field.possibleNames);
    const warnings: string[] = [];

    // Sample values (first 5 non-empty from mapped data)
    const sampleValues = allRows
      .map((r) => {
        const v = r[field.field as keyof ExcelRow];
        return v !== null && v !== undefined && v !== '' ? String(v) : null;
      })
      .filter(Boolean) as string[];
    const topSamples = sampleValues.slice(0, 5);

    // Type inference from sample
    const rawSample = allRows.slice(0, 20).map((r) => r[field.field as keyof ExcelRow]);
    const inferredType = inferType(rawSample);

    // Confidence
    let confidence: number;
    if (matchType === 'exact') {
      confidence = 100;
    } else if (matchType === 'partial') {
      confidence = 70;
    } else if (matchType === 'not_found') {
      if (field.required) {
        confidence = 0;
        warnings.push('No se encontró una columna que coincida');
      } else {
        confidence = 50;
        warnings.push('Columna no encontrada (opcional)');
      }
    } else {
      confidence = 50;
    }

    // Specific warnings per field
    if (field.field === 'price' && inferredType === 'Texto') {
      const nonNumeric = allRows
        .slice(0, 50)
        .filter((r) => r.price && !/^-?\d+(\.\d+)?$/.test(r.price.trim()))
        .map((r) => r.price);
      if (nonNumeric.length > 0) {
        warnings.push('Valores no numéricos: ' + [...new Set(nonNumeric)].slice(0, 3).join(', '));
      }
    }

    if (field.field === 'stock') {
      const rawValues = allRows.slice(0, 20).map((r) => r.stock);
      const hasNonNumericOrigin = rawValues.some((v) => typeof v !== 'number');
      if (hasNonNumericOrigin) {
        warnings.push('Algunos valores fueron convertidos desde texto');
      }
    }

    return {
      field: field.field,
      label: field.label,
      originalHeader: match,
      matchType,
      inferredType,
      confidence,
      warnings,
      sampleValues: topSamples,
      required: field.required,
    };
  });

  // ── Anomaly detection ──
  const anomalies: Anomaly[] = [];

  // Missing titles
  const noTitle = allRows.map((r, i) => (!r.title ? i : -1)).filter((i) => i !== -1);
  if (noTitle.length > 0) {
    anomalies.push({
      type: 'missing_title',
      severity: 'error',
      label: 'Productos sin título',
      count: noTitle.length,
      description: noTitle.length + ' fila(s) no tienen título. Se importarán con nombre vacío.',
      sampleRows: noTitle.slice(0, 5),
    });
  }

  // Title truncated (> 100 chars in original)
  const nearLimit = allRows.map((r, i) => (r.title.length >= 95 ? i : -1)).filter((i) => i !== -1);
  if (nearLimit.length > 0) {
    anomalies.push({
      type: 'title_truncated',
      severity: 'warning',
      label: 'Títulos cerca del límite',
      count: nearLimit.length,
      description: nearLimit.length + ' título(s) están cerca del límite de 100 caracteres.',
      sampleRows: nearLimit.slice(0, 5),
    });
  }

  // Invalid prices (non-numeric string that will become 0)
  const badPrices = allRows
    .map((r, i) => (r.price && !/^-?\d+(\.\d+)?$/.test(r.price.trim()) ? i : -1))
    .filter((i) => i !== -1);
  if (badPrices.length > 0) {
    anomalies.push({
      type: 'invalid_price',
      severity: 'error',
      label: 'Precios inválidos',
      count: badPrices.length,
      description: badPrices.length + ' precio(s) contienen texto no numérico. Se convertirán a 0.',
      sampleRows: badPrices.slice(0, 5),
    });
  }

  // Negative stock
  const negStock = allRows.map((r, i) => (r.stock < 0 ? i : -1)).filter((i) => i !== -1);
  if (negStock.length > 0) {
    anomalies.push({
      type: 'negative_stock',
      severity: 'warning',
      label: 'Stock negativo',
      count: negStock.length,
      description: negStock.length + ' producto(s) tienen stock negativo. Se importarán como 0.',
      sampleRows: negStock.slice(0, 5),
    });
  }

  // Missing images (only flag if many are missing)
  const noImage = allRows.map((r, i) => (!r.image ? i : -1)).filter((i) => i !== -1);
  if (noImage.length > allRows.length * 0.7 && allRows.length > 0) {
    anomalies.push({
      type: 'missing_image',
      severity: 'info',
      label: 'Productos sin imagen',
      count: noImage.length,
      description:
        noImage.length +
        ' producto(s) (' +
        Math.round((noImage.length / allRows.length) * 100) +
        '%) no tienen imagen.',
      sampleRows: noImage.slice(0, 3),
    });
  }

  // Duplicate titles
  const dupes = detectDuplicateTitles(allRows);
  if (dupes.length > 0) {
    const totalDuped = dupes.reduce((sum, d) => sum + d.indices.length - 1, 0);
    anomalies.push({
      type: 'duplicate_title',
      severity: 'warning',
      label: 'Títulos duplicados',
      count: totalDuped,
      description:
        dupes.length + ' título(s) aparecen más de una vez (' + totalDuped + ' filas duplicadas).',
      sampleRows: dupes.slice(0, 3).flatMap((d) => d.indices.slice(1, 3)),
    });
  }

  // ── Summary statistics ──
  const categories = Array.from(new Set(allRows.map((r) => r.category))).map((cat) => ({
    name: cat,
    count: allRows.filter((r) => r.category === cat).length,
  }));

  const prices = allRows.map((r) => Number(r.price)).filter((n) => Number.isFinite(n) && n > 0);
  const priceRange: SummaryStats['priceRange'] =
    prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;

  const summary: SummaryStats = {
    totalRows: allRows.length,
    totalSheets: Object.keys(data).length,
    categories,
    priceRange,
    stockTotal: allRows.reduce((sum, r) => sum + r.stock, 0),
    productsWithoutStock: allRows.filter((r) => r.stock === 0).length,
    productsWithoutTitle: noTitle.length,
    productsWithImage: allRows.filter((r) => r.image).length,
  };

  // ── Quality score (0-100) ──
  const scores: number[] = [];

  // Field detection score (60% weight)
  const fieldScore = columns.reduce((s, c) => {
    if (c.required && c.matchType === 'not_found') return s;
    return s + (c.confidence / 100) * (c.required ? 20 : 10);
  }, 0);
  scores.push(fieldScore * 0.6);

  // Anomaly penalty (20% weight)
  const errorCount = anomalies
    .filter((a) => a.severity === 'error')
    .reduce((s, a) => s + a.count, 0);
  const warningCount = anomalies
    .filter((a) => a.severity === 'warning')
    .reduce((s, a) => s + a.count, 0);
  const anomalyPenalty = Math.min(100, errorCount * 5 + warningCount * 2);
  scores.push(Math.max(0, 100 - anomalyPenalty) * 0.2);

  // Completeness score (20% weight)
  const titleRate =
    summary.totalRows > 0 ? 1 - summary.productsWithoutTitle / summary.totalRows : 0;
  const priceRate = summary.totalRows > 0 ? 1 - badPrices.length / summary.totalRows : 0;
  const completenessScore = ((titleRate + priceRate) / 2) * 100;
  scores.push(completenessScore * 0.2);

  const qualityScore = Math.round(scores.reduce((s, v) => s + v, 0));

  return { columns, anomalies, summary, qualityScore };
}
