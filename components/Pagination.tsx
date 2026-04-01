import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  totalRows: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalRows,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startRow = (currentPage - 1) * itemsPerPage + 1;
  const endRow = Math.min(currentPage * itemsPerPage, totalRows);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-gray-800/30 border-t border-gray-800">
      <div className="text-sm text-gray-400">
        Showing <span className="font-bold text-blue-400">{startRow}</span> to{" "}
        <span className="font-bold text-blue-400">{endRow}</span> of{" "}
        <span className="font-bold text-blue-400">
          {totalRows.toLocaleString()}
        </span>{" "}
        rows
      </div>

      <div className="flex items-center gap-3">
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-300 cursor-pointer hover:border-gray-600 transition-colors"
        >
          <option value={10}>10 rows</option>
          <option value={25}>25 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-800 bg-gray-900 text-gray-300"
          >
            ← Prev
          </button>

          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              className={`
                min-w-[40px] px-3 py-2 text-sm font-medium rounded-xl transition-all
                ${
                  page === currentPage
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : page === "..."
                      ? "cursor-default text-gray-600 bg-transparent"
                      : "border border-gray-700 hover:border-gray-600 hover:bg-gray-800 bg-gray-900 text-gray-300"
                }
              `}
              disabled={page === "..."}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-800 bg-gray-900 text-gray-300"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
