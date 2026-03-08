import { Button, Icon, IconButton } from '@/shared/components/ui';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  currentItemsCount: number;
  onPageChange: (page: number) => void;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  totalFiltered,
  currentItemsCount,
  onPageChange,
}: TablePaginationProps) => {
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

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant="text"
            className={`page-num ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

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
