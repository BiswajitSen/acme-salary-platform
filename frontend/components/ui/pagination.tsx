import { Button } from "./button";

import styles from "./pagination.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  isLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function Pagination({
  page,
  totalPages,
  isLoading = false,
  onPrevious,
  onNext,
}: PaginationProps) {
  const displayTotalPages = Math.max(totalPages, 1);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <span className={styles.summary}>
        Page {page} of {displayTotalPages}
      </span>
      <div className={styles.controls}>
        <Button disabled={page <= 1 || isLoading} onClick={onPrevious}>
          Previous
        </Button>
        <Button disabled={page >= totalPages || isLoading} onClick={onNext}>
          Next
        </Button>
      </div>
    </nav>
  );
}
