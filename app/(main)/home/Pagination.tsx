'use client';

import styles from './Pagination.module.css';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          className={`${styles.pageDot} ${page === currentPage ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
          aria-label={`Ir a página ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
