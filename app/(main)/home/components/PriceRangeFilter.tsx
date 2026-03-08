'use client';

import { Icon } from '@/shared';
import { Slider } from '@/shared/components/ui/inputs/Slider';
import { type FormEvent, useEffect, useState } from 'react';
import styles from './PriceRangeFilter.module.css';

interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number, max: number) => void;
  currencySymbol?: string;
  className?: string;
}

export const PriceRangeFilter = ({
  minPrice,
  maxPrice,
  currentMin,
  currentMax,
  onChange,
  currencySymbol = 'S/',
  className = '',
}: PriceRangeFilterProps) => {
  // Local state for smooth UI typing/sliding before committing changes
  const [localMin, setLocalMin] = useState(currentMin);
  const [localMax, setLocalMax] = useState(currentMax);

  // Sync local state when props change
  useEffect(() => {
    setLocalMin((prev) => (prev === currentMin ? prev : currentMin));
    setLocalMax((prev) => (prev === currentMax ? prev : currentMax));
  }, [currentMin, currentMax]);

  const handleSliderChange = (e: FormEvent<HTMLElement>) => {
    const target = e.target as EventTarget & { valueStart?: number; valueEnd?: number };
    const valueStart = target.valueStart ?? currentMin;
    const valueEnd = target.valueEnd ?? currentMax;
    const newMin = Math.max(minPrice, valueStart);
    const newMax = Math.min(maxPrice, valueEnd);

    setLocalMin(newMin);
    setLocalMax(newMax);
    // Note: We don't call onChange here anymore, we wait for the "Filtrar" button click
  };

  const handleFilterClick = () => {
    onChange(localMin, localMax);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <span className={styles.priceLabel}>
          Desde &ensp;
          <span className={styles.priceValue}>
            {currencySymbol} {localMin}
          </span>{' '}
          &ensp; a &ensp;
          <span className={styles.priceValue}>
            {currencySymbol} {localMax}
          </span>{' '}
        </span>
        <button className={styles.filterBtn} onClick={handleFilterClick}>
          <Icon slot="icon" size={21}>
            refresh
          </Icon>
        </button>
      </div>

      <div className={styles.sliderContainer}>
        <Slider
          range
          min={minPrice}
          max={maxPrice}
          valueStart={localMin}
          valueEnd={localMax}
          step={1}
          onInput={handleSliderChange}
          className={styles.slider}
        />
      </div>
    </div>
  );
};
