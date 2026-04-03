import React, { useState, useEffect, useRef } from "react";
import { getVerificationStatus } from "@/utils/api";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalChunks: number;
  currentChunk: number;
  status: "idle" | "uploading" | "verifying" | "completed" | "failed";
  verificationStatus?: string;
  errorCsvUrl?: string;
  onStatusUpdate?: (status: string, errorUrl?: string) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  totalChunks,
  currentChunk,
  status: parentStatus,
  verificationStatus: parentVerificationStatus,
  errorCsvUrl: parentErrorCsvUrl,
  onStatusUpdate,
}) => {
  const [pollingStatus, setPollingStatus] = useState<string>("");
  const [pollingMessage, setPollingMessage] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [localStatus, setLocalStatus] = useState<
    "idle" | "uploading" | "verifying" | "completed" | "failed"
  >(parentStatus);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingActiveRef = useRef<boolean>(false);

  // Update local status when parent status changes
  useEffect(() => {
    setLocalStatus(parentStatus);
  }, [parentStatus]);

  // Update download URL when parent provides it
  useEffect(() => {
    if (parentErrorCsvUrl) {
      setDownloadUrl(parentErrorCsvUrl);
    }
  }, [parentErrorCsvUrl]);

  useEffect(() => {
    // Cleanup function to clear interval when component unmounts or modal closes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        isPollingActiveRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    // Start polling when status changes to 'verifying'
    if (localStatus === "verifying" && !isPollingActiveRef.current) {
      isPollingActiveRef.current = true;

      // Function to check status
      const checkStatus = async () => {
        try {
          const response = await getVerificationStatus();
          console.log("Polling response:", response.data);

          setPollingStatus(response.data.status);
          setPollingMessage(response.data.message);

          if (response.data.errorCsvUrl) {
            setDownloadUrl(response.data.errorCsvUrl);
            // Notify parent component about the error URL
            if (onStatusUpdate) {
              onStatusUpdate(response.data.status, response.data.errorCsvUrl);
            }
          } else {
            if (onStatusUpdate) {
              onStatusUpdate(response.data.status);
            }
          }

          // Stop polling if status is Success or Failed
          if (response.data.status === "Success") {
            setPollingStatus("Success");
            setLocalStatus("completed");
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              isPollingActiveRef.current = false;
            }
          } else if (response.data.status === "Failed") {
            setPollingStatus("Failed");
            setLocalStatus("failed");
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              isPollingActiveRef.current = false;
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      };

      // Call immediately
      checkStatus();

      // Then set up interval for every 10 seconds
      pollingIntervalRef.current = setInterval(async () => {
        await checkStatus();
      }, 10000); // 10 seconds interval
    }

    // Cleanup when status changes away from verifying
    if (localStatus !== "verifying" && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      isPollingActiveRef.current = false;
    }
  }, [localStatus, onStatusUpdate]);

  const handleOpenErrorCsv = () => {
    if (downloadUrl) {
      // Open the error CSV URL in a new tab, browser will auto-download
      window.open(downloadUrl, "_blank");
    }
  };

  if (!isOpen) return null;

  const getStatusIcon = () => {
    if (localStatus === "uploading") return "📤";
    if (localStatus === "verifying") return "🔄";
    if (localStatus === "completed") return "✅";
    if (localStatus === "failed") return "❌";
    return "⏳";
  };

  const getStatusText = () => {
    if (localStatus === "uploading") return "Uploading Data...";
    if (localStatus === "verifying") return "Verifying Data...";
    if (localStatus === "completed") return "Verification Complete!";
    if (localStatus === "failed") return "Verification Failed";
    return "Processing...";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl animate-slide-in">
        <div className="text-center">
          {/* Status Icon */}
          <div className="text-6xl mb-4">{getStatusIcon()}</div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-2">
            {getStatusText()}
          </h3>

          {/* Progress for uploading */}
          {localStatus === "uploading" && (
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">
                Uploading chunk {currentChunk} of {totalChunks}
              </div>
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${(currentChunk / totalChunks) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {Math.round((currentChunk / totalChunks) * 100)}% complete
              </div>
            </div>
          )}

          {/* Verification Status */}
          {localStatus === "verifying" && (
            <div className="mt-4">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-3"></div>
              </div>
              <div className="text-sm text-gray-400">
                Verifying subscription data...
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Status: {pollingStatus || "Pending"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Checking every 10 seconds...
              </div>
            </div>
          )}

          {/* Success Message */}
          {localStatus === "completed" && (
            <div className="mt-4">
              <div className="text-green-400 text-sm mb-2">
                All data has been verified successfully!
              </div>
              <div className="text-xs text-gray-500">
                You can now close this window
              </div>
            </div>
          )}

          {/* Failed Status with Download Button */}
          {localStatus === "failed" && (
            <div className="mt-4">
              <div className="text-red-400 text-sm mb-3">
                Verification failed. Please check the error report.
              </div>
              {downloadUrl ? (
                <button
                  onClick={handleOpenErrorCsv}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-all"
                >
                  📥 Download Error CSV
                </button>
              ) : (
                <div className="text-yellow-400 text-xs">
                  Loading error report...
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          {(localStatus === "completed" || localStatus === "failed") && (
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all w-full"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
