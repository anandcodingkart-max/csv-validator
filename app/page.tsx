"use client";

import { useState, useCallback, useRef } from "react";
import CSVUploader from "@/components/CSVUploader";
import DataTable from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import HeaderErrorDisplay from "@/components/HeaderErrorDisplay";
import ValidationResultTable from "@/components/ValidationResultTable";
import VerificationModal from "@/components/VerificationModal";
import AnimatedBackground from "@/components/AnimatedBackground";
import { saveSubscriptionData } from "@/utils/api";
import {
  validateHeaders,
  validateRows,
  convertToObjects,
} from "@/utils/validator";
import type {
  HeaderValidationResult,
  RowValidationResult,
} from "@/utils/validator";

const SHOP = "checkout-ui-build.myshopify.com";

export default function Home() {
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: string[][];
    fileName: string;
    dataObjects?: Record<string, any>[];
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(true);

  // Validation states
  const [headerValidation, setHeaderValidation] =
    useState<HeaderValidationResult | null>(null);
  const [rowValidation, setRowValidation] =
    useState<RowValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [showValidationResults, setShowValidationResults] = useState(false);
  const [isProcessingVerification, setIsProcessingVerification] =
    useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "verifying" | "completed" | "failed"
  >("idle");
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [errorCsvUrl, setErrorCsvUrl] = useState<string>("");

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  const [stats, setStats] = useState({
    numericCols: 0,
    estimatedMemory: 0,
  });

  const handleFileParsed = useCallback(
    (data: { headers: string[]; rows: string[][]; fileName: string }) => {
      const dataObjects = convertToObjects(data.headers, data.rows);

      setCsvData({
        ...data,
        dataObjects,
      });
      setCurrentPage(1);
      setIsLoading(false);
      setError(null);
      setShowUploader(false);
      setHeaderValidation(null);
      setRowValidation(null);
      setShowDataTable(true);
      setShowValidationResults(false);

      const numericCols = data.headers.filter((_, idx) =>
        data.rows.slice(0, 100).some((row) => !isNaN(Number(row[idx]))),
      ).length;

      const estimatedMemory =
        (data.rows.length * data.headers.length * 50) / 1024 / 1024;

      setStats({
        numericCols,
        estimatedMemory: Math.round(estimatedMemory),
      });
    },
    [],
  );

  const handleParsingStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setHeaderValidation(null);
    setRowValidation(null);
  }, []);

  const handleParsingError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setIsLoading(false);
    setCsvData(null);
    setShowUploader(true);
    setShowDataTable(false);
    setShowValidationResults(false);
  }, []);

  const handleUploadAnotherFile = useCallback(() => {
    setCsvData(null);
    setShowUploader(true);
    setHeaderValidation(null);
    setRowValidation(null);
    setError(null);
    setCurrentPage(1);
    setShowDataTable(false);
    setShowValidationResults(false);
    setIsProcessingVerification(false);
  }, []);

  const handleProcessValidation = useCallback(async () => {
    if (!csvData?.dataObjects || !csvData?.headers) return;

    setIsValidating(true);

    // Simulate async validation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Checkpoint 1: Validate Headers
    const headerResult = validateHeaders(csvData.headers);
    setHeaderValidation(headerResult);

    // If subscription_contract_id is missing, stop here
    if (!headerResult.isValid) {
      setShowDataTable(false);
      setShowValidationResults(false);
      setRowValidation(null);
      setIsValidating(false);
      return;
    }

    // Checkpoint 2: Validate Rows
    const rowResult = validateRows(csvData.dataObjects);
    setRowValidation(rowResult);

    // Hide original data table and show validation results
    setShowDataTable(false);
    setShowValidationResults(true);

    setIsValidating(false);
  }, [csvData]);

  const handleProcessVerification = useCallback(async () => {
    if (!csvData?.dataObjects || !rowValidation) return;

    // Get only success data
    const successData = csvData.dataObjects.filter((_, index) => {
      const rowNumber = index + 2;
      const rowErrors = rowValidation.errors.filter((e) => e.row === rowNumber);
      return rowErrors.length === 0;
    });

    if (successData.length === 0) {
      alert("No successful records to process");
      return;
    }

    setIsProcessingVerification(true);
    setShowModal(true);
    setUploadStatus("uploading");
    setVerificationStatus("");
    setErrorCsvUrl("");

    // Create chunks of size 2
    const chunkSize = 2;
    const chunks = [];
    for (let i = 0; i < successData.length; i += chunkSize) {
      chunks.push(successData.slice(i, i + chunkSize));
    }

    setTotalChunks(chunks.length);

    try {
      // Upload chunks one by one
      for (let i = 0; i < chunks.length; i++) {
        if (!isMountedRef.current) return;

        setCurrentChunk(i + 1);
        const isLastChunk = i === chunks.length - 1;

        const payload = {
          shop: SHOP,
          finalFlag: isLastChunk,
          firstFlag: i === 0,
          data: chunks[i],
        };

        await saveSubscriptionData(payload);

        // Small delay between chunks to avoid overwhelming the server
        if (!isLastChunk) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Start verification polling (modal will handle this)
      if (isMountedRef.current) {
        setUploadStatus("verifying");
      }
    } catch (error) {
      console.error("Upload error:", error);
      if (isMountedRef.current) {
        setUploadStatus("failed");
        setVerificationStatus("Failed");
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessingVerification(false);
      }
    }
  }, [csvData, rowValidation]);

  // Add this callback to handle status updates from modal
  const handleStatusUpdate = useCallback(
    (status: string, errorUrl?: string) => {
      if (status === "Success") {
        setUploadStatus("completed");
        setVerificationStatus("Success");
      } else if (status === "Failed") {
        setUploadStatus("failed");
        setVerificationStatus("Failed");
        if (errorUrl) {
          setErrorCsvUrl(errorUrl);
        }
      }
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setUploadStatus("idle");
    setCurrentChunk(0);
    setTotalChunks(0);
    setVerificationStatus("");
    setErrorCsvUrl("");
  }, []);

  const totalPages = csvData
    ? Math.ceil(csvData.rows.length / itemsPerPage)
    : 0;

  // Determine which action buttons to show
  const shouldShowValidateButton =
    !showValidationResults &&
    !headerValidation &&
    !rowValidation &&
    csvData &&
    !showUploader;
  const shouldShowVerificationButton =
    showValidationResults &&
    rowValidation &&
    rowValidation.summary.successCount > 0;
  const shouldShowSkipAndVerifyButton =
    showValidationResults &&
    rowValidation &&
    rowValidation.summary.successCount > 0 &&
    rowValidation.summary.successCount < rowValidation.summary.totalRecords;

  return (
    <>
      <AnimatedBackground />

      <div className="relative min-h-screen">
        {/* Header */}
        <header className="relative z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <img
                    src="https://driftcharge.com/wp-content/uploads/2025/04/drift-charge.svg"
                    alt="Driftcharge"
                    className="h-6 w-auto brightness-0 invert"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Driftcharge</h1>
                  <p className="text-xs text-gray-500">
                    Subscription Data Validator
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {shouldShowValidateButton && (
                  <button
                    onClick={handleProcessValidation}
                    disabled={isValidating}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidating ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        Validating...
                      </>
                    ) : (
                      "🔍 Validate Data"
                    )}
                  </button>
                )}

                {shouldShowVerificationButton &&
                  rowValidation.summary.successCount ===
                    rowValidation.summary.totalRecords && (
                    <button
                      onClick={handleProcessVerification}
                      disabled={isProcessingVerification}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessingVerification ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        "✅ Process Verification"
                      )}
                    </button>
                  )}

                {shouldShowSkipAndVerifyButton && (
                  <button
                    onClick={handleProcessVerification}
                    disabled={isProcessingVerification}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingVerification ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        Processing...
                      </>
                    ) : (
                      "⚠️ Skip Error Rows & Process"
                    )}
                  </button>
                )}

                {csvData && !showUploader && (
                  <button
                    onClick={handleUploadAnotherFile}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-all text-gray-300"
                  >
                    📁 Upload Another File
                  </button>
                )}
              </div>

              <div className="hidden md:flex gap-3">
                <div className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">
                  16 Required Fields
                </div>
                <div className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-mono border border-purple-500/20">
                  Shopify Format
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Hero Section */}
          {showUploader && (
            <div className="text-center mb-12 animate-slide-in">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Subscription Data Validator
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Validate subscription data against Shopify schema with 16
                mandatory fields
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                  subscription_contract_id
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                  customer_id
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                  customer_name
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                  customer_email
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                  status
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                  +11 more
                </span>
              </div>
            </div>
          )}

          {/* Upload Section */}
          {showUploader && (
            <div
              className="mb-8 animate-slide-in"
              style={{ animationDelay: "0.1s" }}
            >
              <CSVUploader
                onFileParsed={handleFileParsed}
                onParsingStart={handleParsingStart}
                onParsingError={handleParsingError}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg animate-slide-in">
              <div className="flex items-center gap-3">
                <div className="text-red-400">⚠️</div>
                <div>
                  <p className="text-red-400 font-medium">{error}</p>
                  <p className="text-red-500/70 text-sm mt-1">
                    Please verify your CSV format
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !csvData && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-16 text-center animate-slide-in border border-gray-700">
              <div className="inline-block">
                <div className="w-12 h-12 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 mt-4">Processing your data...</p>
              <p className="text-sm text-gray-600 mt-2">
                Large files may take a moment
              </p>
            </div>
          )}

          {/* Header Validation Error */}
          {headerValidation && !headerValidation.isValid && (
            <HeaderErrorDisplay
              missingFields={headerValidation.missingFields}
              extraFields={headerValidation.extraFields}
              missingOptionalFields={headerValidation.missingOptionalFields}
              onClose={() => {
                setHeaderValidation(null);
                setShowUploader(true);
                setCsvData(null);
              }}
              onUploadNew={handleUploadAnotherFile}
            />
          )}

          {/* Validation Results Table */}
          {showValidationResults && rowValidation && csvData && (
            <ValidationResultTable
              headers={csvData.headers}
              rows={csvData.dataObjects || []}
              errors={rowValidation.errors}
            />
          )}

          {/* Original Data Table */}
          {csvData && showDataTable && !headerValidation && !rowValidation && (
            <div
              className="animate-slide-in"
              style={{ animationDelay: "0.2s" }}
            >
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">📊</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {csvData.rows.length.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Total Records</p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">📋</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {csvData.headers.length}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Columns Found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expected: subscription_contract_id + optional
                  </p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">✅</div>
                    <div className="text-2xl font-bold text-green-400">
                      Ready
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Validation Status</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click Validate to check data
                  </p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">📄</div>
                    <div className="text-sm font-mono text-green-400 truncate max-w-[150px]">
                      {csvData.fileName}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">File Name</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                <DataTable
                  headers={csvData.headers}
                  rows={csvData.rows}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                />

                {totalPages > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(items) => {
                      setItemsPerPage(items);
                      setCurrentPage(1);
                    }}
                    totalRows={csvData.rows.length}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Verification Modal */}
      {/* Verification Modal */}
      <VerificationModal
        isOpen={showModal}
        onClose={handleCloseModal}
        totalChunks={totalChunks}
        currentChunk={currentChunk}
        status={uploadStatus}
        verificationStatus={verificationStatus}
        errorCsvUrl={errorCsvUrl}
        onStatusUpdate={handleStatusUpdate}
      />
    </>
  );
}
