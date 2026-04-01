import React, { useState } from "react";
import { ValidationError } from "@/types";

interface ErrorTableProps {
  errors: ValidationError[];
}

const ErrorTable: React.FC<ErrorTableProps> = ({ errors }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(errors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedErrors = errors.slice(startIndex, startIndex + itemsPerPage);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-red-500/20 overflow-hidden">
      <div className="p-5 border-b border-red-500/20 bg-red-500/5">
        <h3 className="text-red-400 font-semibold flex items-center gap-2 text-lg">
          <span className="text-2xl">⚠️</span>
          Detailed Error List
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          {errors.length} error(s) found in{" "}
          {new Set(errors.map((e) => e.row)).size} row(s)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-800/80">
            <tr className="border-b border-gray-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-red-400 uppercase tracking-wider">
                Row
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-red-400 uppercase tracking-wider">
                Column
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-red-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-red-400 uppercase tracking-wider">
                Error Message
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {paginatedErrors.map((error, idx) => (
              <tr key={idx} className="hover:bg-red-500/5 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                  {error.row}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono text-xs">
                    {error.column}
                  </span>
                </td>
                <td
                  className="px-6 py-4 text-sm text-yellow-400 font-mono max-w-[250px] truncate"
                  title={error.value}
                >
                  {error.value || "<empty>"}
                </td>
                <td className="px-6 py-4 text-sm text-red-400">
                  {error.error}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-gray-800">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, errors.length)} of{" "}
            {errors.length} errors
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorTable;
