'use client';

import { TextField } from '@/shared/components/ui/inputs/TextField';
import React from 'react';

interface StockPriceSectionProps {
  stock: string;
  price: string;
  secondPrice: string;
  currencySymbol: string;
  stockError?: string;
  priceError?: string;
  onStockChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSecondPriceChange: (value: string) => void;
}

export const StockPriceSection = ({
  stock,
  price,
  secondPrice,
  currencySymbol,
  stockError,
  priceError,
  onStockChange,
  onPriceChange,
  onSecondPriceChange,
}: StockPriceSectionProps) => (
  <div className="form-section">
    <p className="form-section-title">Inventario y Precio</p>
    <div className="form-fields form-row-2">
      <TextField
        label="Stock *"
        variant="outlined"
        type="number"
        min={0}
        value={stock}
        error={!!stockError}
        errorText={stockError}
        supportingText={!stockError ? 'Unidades disponibles' : undefined}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onStockChange(e.target.value)}
        style={{ flex: 1 }}
      />
      <TextField
        label="Precio *"
        variant="outlined"
        prefixText={currencySymbol}
        type="number"
        min={0}
        step="0.01"
        value={price}
        error={!!priceError}
        errorText={priceError}
        supportingText={!priceError ? 'Por unidad' : undefined}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPriceChange(e.target.value)}
        style={{ flex: 1 }}
      />
    </div>
    <div className="form-fields" style={{ marginTop: '16px' }}>
      <TextField
        label="Precio de Oferta (Opcional)"
        variant="outlined"
        prefixText={currencySymbol}
        type="number"
        min={0}
        step="0.01"
        value={secondPrice}
        supportingText="Si se llena, se mostrará como precio rebajado"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSecondPriceChange(e.target.value)}
        style={{ width: '100%' }}
      />
    </div>
  </div>
);
