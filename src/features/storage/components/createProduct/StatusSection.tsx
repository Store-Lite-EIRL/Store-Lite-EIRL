'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import { STATUSES } from './types';

interface StatusSectionProps {
  status: string;
  saleStatus: string;
  statusError?: string;
  onStatusChange: (value: string) => void;
  onSaleStatusChange: (value: string) => void;
}

export const StatusSection = ({
  status,
  saleStatus,
  statusError,
  onStatusChange,
  onSaleStatusChange,
}: StatusSectionProps) => (
  <div className="form-section">
    <p className="form-section-title">Estado del Producto</p>
    <div className="form-fields">
      <div className="status-cards" role="radiogroup" aria-label="Estado del producto">
        {STATUSES.map(({ value, label, desc, color }) => (
          <div
            key={value}
            className={`status-card${status === value ? ' selected' : ''}`}
            onClick={() => onStatusChange(value)}
            role="radio"
            aria-checked={status === value}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onStatusChange(value);
            }}
          >
            <div className="status-card-dot" style={{ background: color }} />
            <div className="status-card-text">
              <span className="status-card-label">{label}</span>
              <span className="status-card-desc">{desc}</span>
            </div>
            {status === value && <Icon className="status-card-check">check_circle</Icon>}
          </div>
        ))}
      </div>
      {statusError && <p className="field-error">{statusError}</p>}
    </div>

    <p className="form-section-title" style={{ marginTop: '24px' }}>
      Etiqueta de Venta
    </p>
    <div className="form-fields">
      <div className="status-cards" role="radiogroup" aria-label="Etiqueta de venta">
        {[
          { value: 'NORMAL', label: 'Normal', desc: 'Sin etiqueta especial', color: '#777' },
          {
            value: 'MAS_VENDIDO',
            label: 'Más Vendido',
            desc: 'Destaca ventas altas',
            color: '#f44336',
          },
          {
            value: 'NUEVO_PRODUCTO',
            label: 'Nuevo',
            desc: 'Producto recién llegado',
            color: '#2196f3',
          },
        ].map(({ value, label, desc, color }) => (
          <div
            key={value}
            className={`status-card${saleStatus === value ? ' selected' : ''}`}
            onClick={() => onSaleStatusChange(value)}
            role="radio"
            aria-checked={saleStatus === value}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSaleStatusChange(value);
            }}
          >
            <div className="status-card-dot" style={{ background: color }} />
            <div className="status-card-text">
              <span className="status-card-label">{label}</span>
              <span className="status-card-desc">{desc}</span>
            </div>
            {saleStatus === value && <Icon className="status-card-check">check_circle</Icon>}
          </div>
        ))}
      </div>
    </div>
  </div>
);
