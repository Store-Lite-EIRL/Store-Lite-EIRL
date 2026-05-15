import * as XLSX from 'xlsx';

/* ──────── Types ──────── */

export interface ExcelRow {
  id: string;
  enumeracion: number | string;
  codigo: string;
  title: string;
  description: string;
  category: string;
  stock: number;
  price: string;
  image: string;
  brand: string;
  extraFields: Record<string, string>;
}

export interface RawSheetInfo {
  name: string;
  rawHeaders: string[];
  totalRows: number;
}

export interface ParseResult {
  data: Record<string, ExcelRow[]>;
  sheetInfo: RawSheetInfo[];
  truncated: boolean;
  sheetsTruncated: boolean;
  /** Cuántas filas se procesaron (puede ser menor a totalRows si se aplicó límite) */
  parsedRowCount: number;
}

const MAX_SHEETS = 1;

/* ──────── Accent normalization ──────── */

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/* ──────── Col-matched getter ──────── */

function getMatchedCol(
  row: Record<string, unknown>,
  possibleNames: string[],
  usedKeys?: Set<string>,
): unknown {
  const normNames = possibleNames.map(normalizeKey);
  const entries = Object.entries(row);

  // 1. Exact match first (candidate)
  for (const [key, value] of entries) {
    if (usedKeys?.has(key)) continue;
    if (normNames.includes(normalizeKey(key))) {
      usedKeys?.add(key);
      return value;
    }
  }

  // 2. Partial match (one contains the other)
  for (const [key, value] of entries) {
    if (usedKeys?.has(key)) continue;
    const kn = normalizeKey(key);
    if (normNames.some((n) => kn.includes(n))) {
      usedKeys?.add(key);
      return value;
    }
  }

  return undefined;
}

/* ──────── Synonym maps ──────── */

const SYNONYMS = {
  code: [
    'codigo',
    'código',
    'code',
    'sku',
    'ref',
    'referencia',
    'reference',
    'id_producto',
    'product_id',
    'productid',
    'item_code',
    'itemcode',
    'internal_code',
    'internalcode',
    'cod',
    'id',
    'part_number',
    'partnumber',
    'modelo',
    'model',
    'cod_prod',
    'codprod',
    'codigo_producto',
  ],
  brand: [
    'marca',
    'brand',
    'MARCA',
    'marca_del_producto',
    'marca_producto',
    'product_brand',
    'brand_name',
    'brandname',
    'maker',
    'manufacturer',
    'fabricante',
    'marca_del_prod',
    'marca_prod',
    'proveedor',
    'supplier',
    'vendor',
  ],
  price: [
    'price',
    'precio',
    'costo',
    'cost',
    'precio_venta',
    'sale_price',
    'precio_de_venta',
    'pv',
    'precio_unitario',
    'unit_price',
    'unitprice',
    'importe',
    'amount',
    'valor',
    'value',
    'precio_sin_igv',
    'precio_neto',
    'net_price',
    'precio_lista',
    'list_price',
    'precio_final',
    'final_price',
  ],
  stock: [
    'stock',
    'cantidad',
    'qty',
    'inventario',
    'inventory',
    'quantity',
    'unidades',
    'units',
    'existencia',
    'existencias',
    'disponible',
    'available',
    'cant',
    'stock_actual',
    'current_stock',
    'total_stock',
    'stock_total',
    'saldo',
    'balance',
  ],
  category: [
    'categoria',
    'category',
    'categoría',
    'CATEGORIA',
    'categoría_del_producto',
    'product_category',
    'cat',
    'rubro',
    'linea',
    'line',
    'departamento',
    'department',
    'seccion',
    'section',
    'familia',
    'family',
    'tipo',
    'type',
    'clasificacion',
    'classification',
    'grupo',
    'group',
  ],
  image: [
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
    'image_url',
    'imageurl',
    'imagen_url',
    'imagelink',
    'image_link',
    'foto_url',
    'photo_url',
    'main_image',
    'thumbnail',
  ],
  title: [
    'title',
    'titulo',
    'título',
    'nombre',
    'name',
    'producto',
    'product',
    'item',
    'articulo',
    'artículo',
    'descripcion_corta',
    'short_description',
    'nombre_producto',
    'product_name',
    'productname',
    'item_name',
    'itemname',
    'nom_producto',
    'nom_prod',
    'producto_nombre',
    'titulo_producto',
    'title_product',
    'prod_name',
    'descripcion_breve',
    'brief_description',
    'titulo_del_producto',
    'nombre_del_producto',
  ],
  description: [
    'description',
    'descripcion',
    'descripción',
    'desc',
    'detalle',
    'detail',
    'descripcion_larga',
    'long_description',
    'descripcion_completa',
    'full_description',
    'descripcion_del_producto',
    'product_description',
    'desc_prod',
    'descripcion_extendida',
    'extended_description',
    'comentarios',
    'comments',
    'observaciones',
    'notes',
    'notas',
    'informacion',
    'information',
    'descripcion_adicional',
    'additional_description',
    'detalle_producto',
    'product_detail',
    'especificaciones',
    'specifications',
    'specs',
    'caracteristicas',
    'features',
    'descripcion_del_articulo',
    'descripcion_item',
    'item_description',
    'contenido',
    'content',
    'texto',
    'text',
  ],
} as const;

/* ──────── Main parser ──────── */

export function parseWorkbook(file: File, maxRows = 200): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));

    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const out: Record<string, ExcelRow[]> = {};
        const sheetInfo: RawSheetInfo[] = [];
        let truncated = false;
        let sheetsTruncated = false;
        let totalParsedCount = 0;

        let sheetNames = wb.SheetNames;
        if (sheetNames.length > MAX_SHEETS) {
          sheetNames = sheetNames.slice(0, MAX_SHEETS);
          sheetsTruncated = true;
        }

        sheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
          const totalRows = rawRows.length;

          // Detect raw headers from first row
          const rawHeaders = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

          let rows = rawRows;
          if (rows.length > maxRows) {
            rows = rows.slice(0, maxRows);
            truncated = true;
          }

          const parsedRows = rows.map((row, idx) => {
            const usedKeys = new Set<string>();

            // ── Enumeración (always from index, no col match) ──
            const enumeracion: number | string = idx + 1;

            // ── Code (matched FIRST to avoid false positives) ──
            const rawCode = getMatchedCol(row, SYNONYMS.code, usedKeys) ?? '';
            const codigo = String(rawCode).trim();

            // ── Brand (matched early to avoid "producto" stealing it) ──
            const rawBrand = getMatchedCol(row, SYNONYMS.brand, usedKeys) ?? '';
            const brand = String(rawBrand).trim();

            // ── Price ──
            const rawPrice = getMatchedCol(row, SYNONYMS.price, usedKeys) ?? '0';
            const price = String(rawPrice).trim();

            // ── Stock ──
            const rawStock = getMatchedCol(row, SYNONYMS.stock, usedKeys) ?? 0;
            const stock = Number(rawStock) || 0;

            // ── Category ──
            const rawCategory = getMatchedCol(row, SYNONYMS.category, usedKeys) ?? '';
            const category = String(rawCategory).trim() || sheetName;

            // ── Image ──
            const rawImage = getMatchedCol(row, SYNONYMS.image, usedKeys) ?? '';
            const image = String(rawImage).trim();

            // ── Title ──
            const rawTitle = getMatchedCol(row, SYNONYMS.title, usedKeys) ?? '';
            const title = String(rawTitle).trim().substring(0, 100);

            // ── Description ──
            const rawDesc = getMatchedCol(row, SYNONYMS.description, usedKeys) ?? '';
            const description = String(rawDesc).trim().substring(0, 350);

            // ── Extra fields (columns not consumed above) ──
            const extraFields: Record<string, string> = {};
            for (const [key, value] of Object.entries(row)) {
              if (!usedKeys.has(key)) {
                const v = String(value ?? '').trim();
                if (v) extraFields[key] = v;
              }
            }

            return {
              id: `${sheetName}-${idx}`,
              enumeracion,
              codigo,
              title,
              description,
              category,
              stock,
              price,
              image,
              brand,
              extraFields,
            };
          });

          out[sheetName] = parsedRows;
          sheetInfo.push({ name: sheetName, rawHeaders, totalRows });
          totalParsedCount += parsedRows.length;
        });

        resolve({
          data: out,
          sheetInfo,
          truncated,
          sheetsTruncated,
          parsedRowCount: totalParsedCount,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsBinaryString(file);
  });
}
