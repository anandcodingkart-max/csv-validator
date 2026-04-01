import React, { useRef, useState } from "react";
import { parseCSVFile, validateCSVFile } from "@/utils/csvParser";

interface CSVUploaderProps {
  onFileParsed: (data: {
    headers: string[];
    rows: string[][];
    fileName: string;
  }) => void;
  onParsingStart: () => void;
  onParsingError: (error: string) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({
  onFileParsed,
  onParsingStart,
  onParsingError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsingProgress, setParsingProgress] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    const validation = validateCSVFile(file);

    if (!validation.valid) {
      onParsingError(validation.error || "Invalid file");
      return;
    }

    onParsingStart();
    setParsingProgress(0);

    try {
      const result = await parseCSVFile(file, (percentage) => {
        setParsingProgress(percentage);
      });

      onFileParsed({
        headers: result.headers,
        rows: result.rows,
        fileName: file.name,
      });
      setParsingProgress(null);
    } catch (error) {
      onParsingError("Failed to parse CSV file. Please check the file format.");
      setParsingProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`
          relative w-full rounded-2xl cursor-pointer transition-all duration-500
          ${isDragging ? "scale-[1.02]" : "hover:scale-[1.01]"}
        `}
      >
        <div
          className={`
          absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 
          transition-opacity duration-500 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-50"}
        `}
        />

        <div
          className={`
          relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-12 text-center 
          transition-all duration-500 border border-gray-700
          ${isDragging ? "bg-gray-800/70 border-blue-500" : "hover:border-gray-600"}
        `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`
              w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 
              flex items-center justify-center transition-all duration-500 shadow-lg
              ${isDragging ? "scale-110 shadow-blue-500/50" : "group-hover:scale-110"}
            `}
            >
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <p className="text-2xl font-bold text-white">
                {isDragging ? "Drop to Upload" : "Upload CSV File"}
              </p>
              <p className="text-gray-400 mt-2">
                Drag & drop or click to browse
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20">
                  CSV only
                </span>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm border border-purple-500/20">
                  Unlimited size
                </span>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-sm border border-indigo-500/20">
                  Browser native
                </span>
              </div>
            </div>

            {parsingProgress !== null && (
              <div className="w-full max-w-md mt-4">
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${parsingProgress}%` }}
                  />
                  <div className="absolute inset-0 shimmer" />
                </div>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Parsing data... {Math.round(parsingProgress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUploader;
