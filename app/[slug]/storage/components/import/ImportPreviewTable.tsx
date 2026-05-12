import type { ExcelRow } from './ExcelParser';

interface ImportPreviewTableProps {
  rows: ExcelRow[];
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  return (
    <div
      style={{
        flex: 1,
        overflowX: 'auto',
        overflowY: 'auto',
        minHeight: 0,
      }}
    >
      <table
        className="storage-table"
        style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th style={{ width: 56, textAlign: 'center' }}>#</th>
            <th style={{ minWidth: 160 }}>Título</th>
            <th style={{ minWidth: 220 }}>Descripción</th>
            <th style={{ width: 80, textAlign: 'center' }}>Stock</th>
            <th style={{ width: 100, textAlign: 'right' }}>Precio</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: 'center',
                  padding: '2.5rem',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                No hay productos en esta hoja.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td
                  style={{
                    textAlign: 'center',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '0.8rem',
                  }}
                >
                  {String(r.enumeracion)}
                </td>
                <td style={{ fontWeight: 500 }}>{r.title || '—'}</td>
                <td
                  title={r.description}
                  style={{
                    maxWidth: 220,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '0.78rem',
                  }}
                >
                  {r.description || '—'}
                </td>
                <td style={{ textAlign: 'center' }}>{r.stock === 0 ? 'AGOTADO' : r.stock}</td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  S/ {r.price}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
