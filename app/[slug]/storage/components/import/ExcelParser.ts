import * as XLSX from 'xlsx';

export interface ExcelRow {
  id: string;
  enumeracion: number | string;
  title: string;
  description: string;
  category: string;
  stock: number;
  price: string;
  image: string;
}

export interface ParseResult {
  data: Record<string, ExcelRow[]>;
  truncated: boolean;
}

function getMatchedCol(row: Record<string, unknown>, possibleNames: string[]): unknown {
  const normNames = possibleNames.map((n) => n.toLowerCase().trim());
  const keys = Object.keys(row);
  for (const key of keys) {
    if (normNames.includes(key.toLowerCase().trim())) {
      return row[key];
    }
  }
  for (const key of keys) {
    const kNorm = key.toLowerCase().trim();
    if (normNames.some((n) => kNorm.includes(n) || n.includes(kNorm))) {
      return row[key];
    }
  }
  return undefined;
}

export function parseWorkbook(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const out: Record<string, ExcelRow[]> = {};
        let truncated = false;

        let sheetNames = wb.SheetNames;
        if (sheetNames.length > 5) {
          sheetNames = sheetNames.slice(0, 5);
          truncated = true;
        }

        sheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          let rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

          if (rows.length > 20) {
            rows = rows.slice(0, 20);
            truncated = true;
          }

          out[sheetName] = rows.map((row, idx) => {
            const rawEnum = getMatchedCol(row, ['enumeracion', '#', 'id', 'no']) ?? idx + 1;
            const enumeracion: number | string =
              typeof rawEnum === 'number' || typeof rawEnum === 'string' ? rawEnum : idx + 1;

            const rawTitle =
              getMatchedCol(row, ['Title', 'titulo', 'nombre', 'name', 'producto']) || '';
            const title = String(rawTitle).trim().substring(0, 100);

            const rawDesc =
              getMatchedCol(row, ['description', 'descripcion', 'desc', 'detalle']) || '';
            const description = String(rawDesc).trim().substring(0, 350);

            const rawStock = getMatchedCol(row, ['stock', 'cantidad', 'qty', 'inventario']) || 0;
            const stock = Number(rawStock) || 0;

            const rawPrice = getMatchedCol(row, ['price', 'precio', 'costo']) || '0';
            const price = String(rawPrice).trim();

            const rawImage =
              getMatchedCol(row, [
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
              ]) || '';
            const image = String(rawImage).trim();

            return {
              id: `${sheetName}-${idx}`,
              enumeracion,
              title,
              description,
              category: sheetName,
              stock,
              price,
              image,
            };
          });
        });

        resolve({ data: out, truncated });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
}
