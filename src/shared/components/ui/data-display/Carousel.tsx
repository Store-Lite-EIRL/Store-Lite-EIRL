'use client';

import '@/styles/components/Carousel.css';
import React, { useState } from 'react';
import { IconButton } from '../buttons/IconButton';
import { Icon } from '../data-display/Icon';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

export const Carousel = ({ children, className = '' }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = React.Children.toArray(children);
  const totalItems = items.length;

  // Calculate which items to show (always show 5 items in a sliding window)
  const getVisibleItems = () => {
    const visibleItems = [];
    for (let i = 0; i < 5; i++) {
      const index = (currentIndex + i) % totalItems;
      visibleItems.push({
        element: items[index],
        position: i, // 0=leftmost, 1=left-center, 2=center, 3=right-center, 4=rightmost
        originalIndex: index,
      });
    }
    return visibleItems;
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const visibleItems = getVisibleItems();

  return (
    <div className={`md-carousel ${className}`}>
      {/* LEFT BUTTON */}
      <div className="md-carousel__nav md-carousel__nav--left">
        <IconButton variant="filled-tonal" onClick={handlePrev} aria-label="Anterior">
          <Icon>chevron_left</Icon>
        </IconButton>
      </div>

      {/* GRID CONTAINER */}
      <div className="md-carousel__grid">
        {visibleItems.map(({ element, position, originalIndex }) => (
          <div
            key={`${originalIndex}-${position}`}
            className={`md-carousel__grid-item md-carousel__grid-item--pos-${position}`}
            data-position={position}
          >
            {element}
          </div>
        ))}
      </div>

      {/* RIGHT BUTTON */}
      <div className="md-carousel__nav md-carousel__nav--right">
        <IconButton variant="filled-tonal" onClick={handleNext} aria-label="Siguiente">
          <Icon>chevron_right</Icon>
        </IconButton>
      </div>
    </div>
  );
};
