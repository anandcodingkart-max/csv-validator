import React, { useState } from "react";

interface DataTableProps {
  headers: string[];
  rows: string[][];
  currentPage: number;
  itemsPerPage: number;
}

const DataTable: React.FC<DataTableProps> = ({
  headers,
  rows,
  currentPage,
  itemsPerPage,
}) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = rows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-800/50 sticky top-0 backdrop-blur-sm">
          <tr className="border-b border-gray-700">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-4 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                  {header || `Column ${idx + 1}`}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {paginatedRows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`
                transition-all duration-200 cursor-pointer
                ${
                  hoveredRow === rowIdx
                    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                    : "hover:bg-gray-800/50"
                }
              `}
              onMouseEnter={() => setHoveredRow(rowIdx)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    {cellIdx === 0 && hoveredRow === rowIdx && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
                    )}
                    <span className={cell ? "font-mono" : "text-gray-600"}>
                      {cell || "—"}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {paginatedRows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">📊</div>
          <p className="text-gray-500">No data to display</p>
        </div>
      )}
    </div>
  );
};

export default DataTable;
