import React from "react";

interface HeaderErrorDisplayProps {
  missingFields: string[];
  extraFields: string[];
  onClose: () => void;
  onUploadNew: () => void;
}

const HeaderErrorDisplay: React.FC<HeaderErrorDisplayProps> = ({
  missingFields,
  extraFields,
  onClose,
  onUploadNew,
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-red-500/20 overflow-hidden mb-8 animate-slide-in">
      <div className="p-6 border-b border-red-500/20 bg-red-500/5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-red-400 font-semibold flex items-center gap-2 text-xl">
              <span className="text-2xl">⚠️</span>
              Header Validation Failed
            </h3>
            <p className="text-gray-400 mt-2">
              Your CSV file does not match the required schema. Please fix the
              following issues:
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Missing Fields Section */}
        {missingFields.length > 0 && (
          <div>
            <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              Allowed Columns ({missingFields.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {missingFields.map((field, idx) => (
                <div
                  key={idx}
                  className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
                >
                  <code className="text-yellow-400 font-mono text-sm">
                    {field}
                  </code>
                  <p className="text-gray-500 text-xs mt-1">
                    Required field is missing
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extra Fields Section */}
        {extraFields.length > 0 && (
          <div>
            <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">❌</span>
              Extra Columns Not Allowed ({extraFields.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {extraFields.map((field, idx) => (
                <div
                  key={idx}
                  className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
                >
                  <code className="text-red-400 font-mono text-sm">
                    {field}
                  </code>
                  <p className="text-gray-500 text-xs mt-1">
                    This column is not allowed
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-700 bg-gray-800/30">
        <div className="flex justify-center">
          <button
            onClick={onUploadNew}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all"
          >
            Upload New File
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderErrorDisplay;
