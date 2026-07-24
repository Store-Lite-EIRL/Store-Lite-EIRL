import { Icon } from '@/shared/components/ui/data-display/Icon';
import type { ExcelRow } from './ExcelParser';

/* ──────── Types ──────── */

interface ImportPreviewTableProps {
  rows: ExcelRow[];
  startIndex: number;
  unmatchedHeaders: string[];
  selectedExtraFields: Set<string>;
  onToggleExtraField: (header: string) => void;
}

/* ──────── Product image cell ──────── */

function ProductImageCell({ image, title }: { image: string; title: string }) {
  if (!image) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: '0.65rem',
          whiteSpace: 'nowrap',
        }}
      >
        <Icon style={{ fontSize: 16, opacity: 0.5 }}>hide_image</Icon>
        <span>sin imagen</span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={title || 'Producto'}
      style={{
        width: 40,
        height: 40,
        borderRadius: 6,
        objectFit: 'cover',
        background: 'var(--md-sys-color-surface-variant)',
        display: 'block',
      }}
      loading="lazy"
    />
  );
}

/* ──────── Main component ──────── */

export function ImportPreviewTable({
  rows,
  startIndex,
  unmatchedHeaders,
  selectedExtraFields,
  onToggleExtraField,
}: ImportPreviewTableProps) {
  const colCount = 9 + unmatchedHeaders.length;
  const tableMinWidth = Math.max(1200, 1200 + unmatchedHeaders.length * 140);

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
        style={{
          width: '100%',
          minWidth: tableMinWidth,
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: 50 }} />
          <col style={{ width: 140, minWidth: 140 }} />
          <col style={{ width: 76 }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
          {unmatchedHeaders.map((h) => (
            <col key={h} style={{ width: 140 }} />
          ))}
        </colgroup>

        <thead>
          <tr>
            <th style={{ textAlign: 'center', width: 50 }}>N°</th>
            <th style={{ textAlign: 'center', minWidth: 140, width: 140 }}>Código</th>
            <th style={{ textAlign: 'center' }}>Imagen</th>
            <th>Título</th>
            <th>Descripción</th>
            <th style={{ textAlign: 'center' }}>Stock</th>
            <th style={{ textAlign: 'right' }}>Precio</th>
            <th>Categoría</th>
            <th>Marca</th>
            {unmatchedHeaders.map((h) => {
              const checked = selectedExtraFields.has(h);
              return (
                <th
                  key={h}
                  style={{
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    padding: '0.5rem 0.35rem',
                  }}
                >
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      color: checked
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-on-surface-variant)',
                      fontWeight: checked ? 700 : 400,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleExtraField(h)}
                      style={{
                        accentColor: 'var(--md-sys-color-primary)',
                        width: 14,
                        height: 14,
                        cursor: 'pointer',
                        margin: 0,
                      }}
                    />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 80,
                      }}
                      title={h}
                    >
                      {h}
                    </span>
                  </label>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={colCount}
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
            rows.map((r, idx) => (
              <tr key={r.id}>
                {/* N° (local row number, not saved) */}
                <td
                  style={{
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontFamily: 'var(--mio-theme-text-font-family), monospace',
                  }}
                >
                  {startIndex + idx}
                </td>

                {/* Código */}
                <td
                  style={{
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--mio-theme-text-font-family), monospace',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={r.codigo}
                >
                  {r.codigo || '—'}
                </td>

                {/* Imagen */}
                <td style={{ textAlign: 'center', padding: '0.25rem 0.5rem' }}>
                  <ProductImageCell image={r.image} title={r.title} />
                </td>

                {/* Título */}
                <td
                  style={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={r.title}
                >
                  {r.title || (
                    <span
                      style={{
                        color: 'var(--md-sys-color-on-surface-variant)',
                        fontStyle: 'italic',
                      }}
                    >
                      sin título
                    </span>
                  )}
                </td>

                {/* Descripción */}
                <td
                  title={r.description}
                  style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.description || '—'}
                  </div>
                </td>

                {/* Stock */}
                <td
                  style={{
                    textAlign: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    {r.stock === 0 ? (
                      <span style={{ color: '#b3261e', fontWeight: 600, fontSize: '0.75rem' }}>
                        AGOTADO
                      </span>
                    ) : (
                      r.stock
                    )}
                  </span>
                </td>

                {/* Precio */}
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 600,
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  S/ {r.price}
                </td>

                {/* Categoría */}
                <td
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.78rem',
                  }}
                  title={r.category}
                >
                  {r.category || '—'}
                </td>

                {/* Marca */}
                <td
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.78rem',
                    color: r.brand ? undefined : 'var(--md-sys-color-on-surface-variant)',
                  }}
                  title={r.brand}
                >
                  {r.brand || '—'}
                </td>

                {/* Extra fields */}
                {unmatchedHeaders.map((h) => {
                  const checked = selectedExtraFields.has(h);

                  return (
                    <td
                      key={h}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.78rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: checked ? undefined : 'var(--md-sys-color-on-surface-variant)',
                        opacity: checked ? 1 : 0.55,
                      }}
                      title={r.extraFields[h] || ''}
                    >
                      {checked ? r.extraFields[h] || '\u2014' : 'omitido'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
