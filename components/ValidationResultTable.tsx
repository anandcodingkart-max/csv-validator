import React, { useState } from "react";
import { ValidationError } from "@/types";

interface ValidationResultTableProps {
  headers: string[];
  rows: Record<string, any>[];
  errors: ValidationError[];
}

interface RowWithValidation {
  data: Record<string, any>;
  status: "success" | "failed";
  errorMessages: string[];
  rowIndex: number;
}

const ValidationResultTable: React.FC<ValidationResultTableProps> = ({
  headers,
  rows,
  errors,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [exportProgress, setExportProgress] = useState<{
    isExporting: boolean;
    percentage: number;
    type: string;
  }>({
    isExporting: false,
    percentage: 0,
    type: "",
  });

  // Group errors by row
  const errorsByRow = errors.reduce(
    (acc, error) => {
      if (!acc[error.row]) {
        acc[error.row] = [];
      }
      acc[error.row].push(error.error);
      return acc;
    },
    {} as Record<number, string[]>,
  );

  // Prepare rows with validation status
  const rowsWithValidation: RowWithValidation[] = rows.map((row, index) => {
    const rowNumber = index + 2; // +2 for header and 0-index
    const rowErrors = errorsByRow[rowNumber] || [];

    return {
      data: row,
      status: rowErrors.length === 0 ? "success" : "failed",
      errorMessages: rowErrors,
      rowIndex: index,
    };
  });

  // Export CSV function with progress tracking
  const exportToCSV = async (type: "full" | "success" | "failed") => {
    let dataToExport: RowWithValidation[] = [];

    if (type === "full") {
      dataToExport = rowsWithValidation;
    } else if (type === "success") {
      dataToExport = rowsWithValidation.filter(
        (row) => row.status === "success",
      );
    } else if (type === "failed") {
      dataToExport = rowsWithValidation.filter(
        (row) => row.status === "failed",
      );
    }

    if (dataToExport.length === 0) {
      alert(
        `No ${type === "success" ? "successful" : type === "failed" ? "failed" : ""} records to export`,
      );
      return;
    }

    setExportProgress({ isExporting: true, percentage: 0, type });

    // Use setTimeout to allow UI to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Prepare CSV headers
      const csvHeaders = ["Row Number", "Status", ...headers, "Error Messages"];

      // Process in chunks to avoid blocking UI
      const chunkSize = 1000;
      const totalChunks = Math.ceil(dataToExport.length / chunkSize);
      let allRows: string[][] = [];

      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const start = chunk * chunkSize;
        const end = Math.min(start + chunkSize, dataToExport.length);
        const chunkData = dataToExport.slice(start, end);

        // Process chunk
        const chunkRows = chunkData.map((row, idx) => {
          const rowNumber = start + idx + 1;
          const statusText = row.status === "success" ? "Success" : "Failed";
          const errorMessagesText = row.errorMessages.join("; ");

          // Map data rows
          const dataRow = headers.map((header) => {
            let value = row.data[header];
            // Escape quotes and handle commas
            if (typeof value === "string") {
              value = value.replace(/"/g, '""');
              if (
                value.includes(",") ||
                value.includes('"') ||
                value.includes("\n")
              ) {
                value = `"${value}"`;
              }
            } else if (value === undefined || value === null) {
              value = "";
            } else {
              value = String(value);
            }
            return value;
          });

          return [String(rowNumber), statusText, ...dataRow, errorMessagesText];
        });

        allRows.push(...chunkRows);

        // Update progress
        const progress = ((chunk + 1) / totalChunks) * 100;
        setExportProgress({ isExporting: true, percentage: progress, type });

        // Allow UI to update between chunks
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Generate CSV content
      const csvContent = [
        csvHeaders.map((header) => `"${header.replace(/"/g, '""')}"`).join(","),
        ...allRows.map((row) =>
          row
            .map((cell) => {
              const stringCell = String(cell);
              if (
                stringCell.includes(",") ||
                stringCell.includes('"') ||
                stringCell.includes("\n")
              ) {
                return `"${stringCell.replace(/"/g, '""')}"`;
              }
              return stringCell;
            })
            .join(","),
        ),
      ].join("\n");

      // Create download link
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const fileName = `validation_${type}_${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setExportProgress({ isExporting: false, percentage: 0, type: "" });
    }
  };

  // Pagination
  const totalPages = Math.ceil(rowsWithValidation.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = rowsWithValidation.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Calculate statistics
  const successCount = rowsWithValidation.filter(
    (r) => r.status === "success",
  ).length;
  const failedCount = rowsWithValidation.filter(
    (r) => r.status === "failed",
  ).length;

  return (
    <div className="animate-slide-in">
      {/* Export Progress Modal */}
      {exportProgress.isExporting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="inline-block">
                <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Exporting{" "}
                {exportProgress.type === "full"
                  ? "Full"
                  : exportProgress.type === "success"
                    ? "Success"
                    : "Failed"}{" "}
                CSV
              </h3>
              <div className="mt-4">
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${exportProgress.percentage}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {Math.round(exportProgress.percentage)}% complete
                </p>
              </div>
              <p className="text-gray-500 text-xs mt-4">
                Processing large file... Please wait
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📊</div>
            <div className="text-2xl font-bold text-blue-400">
              {rows.length.toLocaleString()}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Total Records</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">✅</div>
            <div className="text-2xl font-bold text-green-400">
              {successCount.toLocaleString()}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Successful</p>
          <p className="text-xs text-green-500/70 mt-1">
            {((successCount / rows.length) * 100).toFixed(1)}% valid
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">❌</div>
            <div className="text-2xl font-bold text-red-400">
              {failedCount.toLocaleString()}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Failed</p>
          <p className="text-xs text-red-500/70 mt-1">
            {((failedCount / rows.length) * 100).toFixed(1)}% invalid
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📈</div>
            <div
              className={`text-2xl font-bold ${failedCount === 0 ? "text-green-400" : "text-yellow-400"}`}
            >
              {failedCount === 0 ? "Passed" : "Failed"}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Overall Status</p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => exportToCSV("full")}
          disabled={exportProgress.isExporting}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          📥 Download Full Validation CSV
        </button>
        <button
          onClick={() => exportToCSV("success")}
          disabled={exportProgress.isExporting || successCount === 0}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          ✅ Download Success CSV ({successCount} rows)
        </button>
        <button
          onClick={() => exportToCSV("failed")}
          disabled={exportProgress.isExporting || failedCount === 0}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          ❌ Download Failed CSV ({failedCount} rows)
        </button>
      </div>

      {/* Data Table with Validation Status */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-800/80 sticky top-0">
              <tr className="border-b border-gray-700">
                {/* Row Number Column */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-800/80">
                  #
                </th>
                {/* Status Column */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                {/* Data Columns */}
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
                {/* Error Message Column */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[300px]">
                  Error Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedRows.map((row) => {
                const isFailed = row.status === "failed";

                return (
                  <tr
                    key={row.rowIndex}
                    className={`
                      transition-all duration-200
                      ${
                        isFailed
                          ? "bg-red-500/10 hover:bg-red-500/20 border-l-4 border-l-red-500"
                          : "hover:bg-gray-700/30"
                      }
                    `}
                  >
                    {/* Row Number */}
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono sticky left-0 bg-gray-800/30">
                      {startIndex + row.rowIndex + 1}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {isFailed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                          Success
                        </span>
                      )}
                    </td>

                    {/* Data Cells */}
                    {headers.map((header, idx) => (
                      <td
                        key={idx}
                        className={`
                          px-4 py-3 text-sm
                          ${isFailed ? "text-gray-300" : "text-gray-300"}
                        `}
                      >
                        <div
                          className="max-w-[200px] truncate"
                          title={row.data[header]}
                        >
                          {row.data[header] || "-"}
                        </div>
                      </td>
                    ))}

                    {/* Error Messages */}
                    <td className="px-4 py-3 text-sm">
                      {row.errorMessages.length > 0 ? (
                        <div className="space-y-1">
                          {row.errorMessages.map((error, idx) => (
                            <div
                              key={idx}
                              className="text-red-400 text-xs flex items-start gap-1"
                            >
                              <span className="text-red-500 mt-0.5">•</span>
                              <span className="flex-1">{error}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-500/70 text-xs">
                          ✓ No errors
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-800 bg-gray-800/30">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, rows.length)} of{" "}
              {rows.length} rows
            </div>

            <div className="flex items-center gap-3">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-300 cursor-pointer"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-800 bg-gray-900 text-gray-300"
                >
                  Previous
                </button>

                <span className="px-3 py-1.5 text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-800 bg-gray-900 text-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationResultTable;
