'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '../data-display';
import { Checkbox } from './Checkbox';
import styles from './DropdownCheckbox.module.css';

interface Option {
  id: string;
  label: string;
}

interface DropdownCheckboxProps {
  label: string;
  options: Option[];
  selectedIds: string[];
  onChange: (id: string, checked: boolean) => void;
  className?: string;
}

export const DropdownCheckbox = ({
  label,
  options,
  selectedIds,
  onChange,
  className = '',
}: DropdownCheckboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen((prev) => !prev);

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <button type="button" className={styles.button} onClick={handleToggle}>
        <span>{label}</span>
        {selectedIds.length > 0 && <span className={styles.badge}>{selectedIds.length}</span>}
        <Icon>{isOpen ? 'expand_less' : 'expand_more'}</Icon>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.length === 0 ? (
            <div className={styles.option}>
              <span className={styles.optionLabel}>No hay opciones</span>
            </div>
          ) : (
            options.map((option) => (
              <label key={option.id} className={styles.option}>
                <Checkbox
                  checked={selectedIds.includes(option.id)}
                  onChange={(e) => onChange(option.id, (e.target as HTMLInputElement).checked)}
                  // prevent click from closing the dropdown immediately if bubbling
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={styles.optionLabel}>{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};
