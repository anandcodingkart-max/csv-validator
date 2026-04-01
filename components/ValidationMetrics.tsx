import React from "react";

interface ValidationMetricsProps {
  totalRecords: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  onClose: () => void;
}

const ValidationMetrics: React.FC<ValidationMetricsProps> = ({
  totalRecords,
  successCount,
  failedCount,
  successRate,
  onClose,
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden mb-8 animate-slide-in">
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <h3 className="text-white font-semibold text-xl">
            Validation Results
          </h3>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {/* Total Records */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📊</div>
            <div className="text-2xl font-bold text-blue-400">
              {totalRecords.toLocaleString()}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Total Records</p>
        </div>

        {/* Successful Records */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">✅</div>
            <div className="text-2xl font-bold text-green-400">
              {successCount.toLocaleString()}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Successful</p>
          <p className="text-xs text-green-500/70 mt-1">
            {successRate.toFixed(1)}% valid
          </p>
        </div>

        {/* Failed Records */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">❌</div>
            <div className="text-2xl font-bold text-red-400">
              {failedCount.toLocaleString()}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Failed</p>
          <p className="text-xs text-red-500/70 mt-1">
            {(100 - successRate).toFixed(1)}% invalid
          </p>
        </div>

        {/* Status */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📈</div>
            <div
              className={`text-2xl font-bold ${failedCount === 0 ? "text-green-400" : "text-yellow-400"}`}
            >
              {failedCount === 0 ? "Passed" : "Failed"}
            </div>
          </div>
          <p className="text-gray-400 text-sm">Overall Status</p>
          {failedCount > 0 && (
            <p className="text-xs text-yellow-500/70 mt-1">
              Review errors below
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationMetrics;
