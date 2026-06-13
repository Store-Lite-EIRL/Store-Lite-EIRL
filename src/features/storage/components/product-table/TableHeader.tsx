import { Icon } from '@/shared/components/ui';
import type { Product } from '../../data';
import type { SortConfig } from '../../hooks/useStorageProducts';

interface TableHeaderProps {
  label: string;
  sortKey: keyof Product;
  sortConfig: SortConfig | null;
  onSort: (key: keyof Product) => void;
}

export const TableHeader = ({ label, sortKey, sortConfig, onSort }: TableHeaderProps) => {
  const getSortIcon = () => {
    if (sortConfig?.key !== sortKey) {
      return 'unfold_more';
    }
    return sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  return (
    <th onClick={() => onSort(sortKey)} className="sortable-th">
      <div className="th-content">
        <span>{label}</span>
        <Icon style={{ fontSize: '18px' }}>{getSortIcon()}</Icon>
      </div>
    </th>
  );
};
