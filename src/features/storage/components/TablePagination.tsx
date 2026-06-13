import { Button, Icon, IconButton } from '@/shared/components/ui';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  currentItemsCount: number;
  onPageChange: (page: number) => void;
}

/**
 * Genera un array de páginas con elipsis para paginación inteligente.
 * Ejemplo: total=50, current=23 → [1, '…', 22, 23, 24, '…', 50]
 */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  if (windowStart > 2) pages.push('ellipsis');

  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i);
  }

  if (windowEnd < total - 1) pages.push('ellipsis');

  pages.push(total);

  return pages;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  totalFiltered,
  currentItemsCount,
  onPageChange,
}: TablePaginationProps) => {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="table-footer">
      <div>
        Mostrando {currentItemsCount} de {totalFiltered} productos
      </div>
      <div className="pagination">
        <IconButton
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <Icon>chevron_left</Icon>
        </IconButton>

        {pageNumbers.map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`e-${idx}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant="text"
              className={`page-num ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ),
        )}

        <IconButton
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <Icon>chevron_right</Icon>
        </IconButton>
      </div>
    </div>
  );
};
