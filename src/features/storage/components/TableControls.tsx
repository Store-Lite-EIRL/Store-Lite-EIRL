import { Icon, Select, TextField } from '@/shared/components/ui';
import { getMaterialSelectValue, type MaterialSelectEvent } from '@/shared/utils';
import React from 'react';
import { useStorage } from '../context/StorageContext';
import type { ExtraColumnsState } from '../hooks/useExtraColumns';
import { StorageColumnManager } from './StorageColumnManager';

interface TableControlsProps {
  extraColumns?: ExtraColumnsState;
}

export const TableControls = ({ extraColumns }: TableControlsProps) => {
  const {
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    categories,
    filterStatus,
    setFilterStatus,
    statuses,
    sortBy,
    setSortBy,
  } = useStorage();

  return (
    <div className="table-controls">
      <div className="search-container">
        <div className="search-box">
          <TextField
            placeholder="Buscar productos..."
            value={searchTerm}
            onInput={(e: React.FormEvent<HTMLInputElement>) => setSearchTerm(e.currentTarget.value)}
            variant="outlined"
          >
            <Icon slot="leading-icon">search</Icon>
          </TextField>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-box">
          <Select
            label="Categoria"
            value={filterCategory}
            onInput={(e: MaterialSelectEvent) => setFilterCategory(getMaterialSelectValue(e))}
            options={[
              { label: 'Todas las categorias', value: 'all' },
              ...categories.map((cat) => ({ label: cat.name, value: cat.name })),
            ]}
          />
        </div>
        <div className="filter-box">
          <Select
            label="Estado"
            value={filterStatus}
            onInput={(e: MaterialSelectEvent) => setFilterStatus(getMaterialSelectValue(e))}
            options={[
              { label: 'Todos los estados', value: 'all' },
              ...statuses.map((st) => ({ label: st, value: st })),
            ]}
          />
        </div>
        <div className="sort-box">
          <Select
            label="Ordenar por"
            value={sortBy}
            onInput={(e: MaterialSelectEvent) => setSortBy(getMaterialSelectValue(e))}
            options={[
              { label: 'Mas recientes', value: 'newest' },
              { label: 'Precio: Menor a Mayor', value: 'low-price' },
              { label: 'Precio: Mayor a Menor', value: 'high-price' },
              { label: 'Stock: Menor a Mayor', value: 'stock-asc' },
              { label: 'Stock: Mayor a Menor', value: 'stock-desc' },
            ]}
          />
        </div>

        {extraColumns && <StorageColumnManager columns={extraColumns} />}
      </div>
    </div>
  );
};
