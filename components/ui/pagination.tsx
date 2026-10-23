import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  disabled,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      data-slot="pagination-link"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center text-xs font-medium rounded-[var(--admin-radius,3px)] transition-colors cursor-pointer select-none",
        size === "icon" && "h-8 w-8 min-w-[32px] p-0",
        size === "default" && "h-8 px-2.5",
        isActive
          ? "bg-[#B4395A] text-white hover:bg-[#9b2f4c] font-semibold border border-[#B4395A] shadow-xs"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none hover:bg-white border-slate-200",
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      disabled={disabled}
      className={cn("gap-1 pl-2.5 pr-3 text-xs h-8", className)}
      {...props}
    >
      <ChevronLeftIcon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      disabled={disabled}
      className={cn("gap-1 pl-3 pr-2.5 text-xs h-8", className)}
      {...props}
    >
      <span className="hidden sm:inline">{text}</span>
      <ChevronRightIcon className="h-3.5 w-3.5" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex h-8 w-8 items-center justify-center text-slate-400", className)}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

function DataTablePagination({
  page,
  totalPages,
  totalItems,
  total,
  limit = 10,
  onPageChange,
  className,
  itemName,
}: any) {
  const count = Number(totalItems ?? total ?? 0);
  const currentPage = Number(page || 1);
  const pageLimit = Number(limit || 10);
  const calculatedTotalPages = Math.max(1, Number(totalPages) || Math.ceil(count / pageLimit) || 1);

  if (count <= 0) return null;

  const from = Math.min((currentPage - 1) * pageLimit + 1, count);
  const to = Math.min(currentPage * pageLimit, count);

  const getPageNumbers = () => {
    const total = calculatedTotalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", total];
    }
    if (currentPage >= total - 2) {
      return [1, "...", total - 3, total - 2, total - 1, total];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", total];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white",
        className
      )}
    >
      <div className="text-xs text-slate-500 font-medium">
        Showing{" "}
        <span className="font-semibold text-slate-800">
          {from === to ? `${from} of ${count}` : `${from}–${to} of ${count}`}
        </span>
      </div>

      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            />
          </PaginationItem>

          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            const pageNum = p as number;
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === page}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  DataTablePagination,
};
