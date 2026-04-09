'use client';

import { Icon } from '@/shared/components/ui/data-display';
import { useRef, useState } from 'react';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  business?: {
    name: string;
    description: string | null;
    address: string | null;
    whatsappNumber: string | null;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function FilterBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = () => {
    onTabChange('products'); // Searching belongs to products view
    if (!isSearchExpanded) {
      setIsSearchExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!searchQuery && !e.currentTarget.contains(e.relatedTarget)) {
      setIsSearchExpanded(false);
    }
  };

  return (
    <div className={styles.filterBarWrapper}>
      <div className={styles.filterContainer}>
        <div className={styles.segmentedGroup}>
          <button
            className={`${styles.segmentedButton} ${activeTab === 'products' ? styles['segmentedButton--active'] : ''}`}
            onClick={() => onTabChange('products')}
          >
            Productos
          </button>

          <div
            className={`${styles.searchInputWrapper} ${isSearchExpanded || searchQuery ? styles['searchInputWrapper--expanded'] : ''}`}
            onBlur={handleBlur}
            tabIndex={-1}
          >
            <button className={styles.searchIconBtn} onClick={handleSearchClick}>
              <Icon size={21}>search</Icon>
              {!isSearchExpanded && !searchQuery && <span>Buscar</span>}
            </button>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onTabChange('products');
              }}
            />
          </div>

          <button
            className={`${styles.segmentedButton} ${activeTab === 'about' ? styles['segmentedButton--active'] : ''}`}
            onClick={() => onTabChange('about')}
          >
            Nosotros
          </button>
        </div>
      </div>
    </div>
  );
}
