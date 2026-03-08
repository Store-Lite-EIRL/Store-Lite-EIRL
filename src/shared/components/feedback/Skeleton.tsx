import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
}: SkeletonProps) {
  const classes = [styles.skeleton, styles[variant], styles.shimmer, className].join(' ');

  const inlineStyle: React.CSSProperties = {
    width,
    height,
    ...style,
  };

  return <div className={classes} style={inlineStyle} />;
}
