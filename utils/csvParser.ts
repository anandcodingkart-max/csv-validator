import Papa from "papaparse";

export interface ParseResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export const parseCSVFile = (
  file: File,
  onProgress?: (percentage: number, rowsProcessed: number) => void,
): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    let headers: string[] = [];
    const rows: string[][] = [];
    let rowsProcessed = 0;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      chunkSize: 1024 * 1024, // 1MB chunks for large files
      chunk: (results, parser) => {
        const data = results.data as string[][];

        if (headers.length === 0 && data.length > 0) {
          headers = data[0];
          data.shift(); // Remove headers
        }

        rows.push(...(data as string[][]));
        rowsProcessed += data.length;

        if (onProgress) {
          const percentage = Math.min(
            (rowsProcessed / (rowsProcessed + data.length)) * 100,
            99,
          );
          onProgress(percentage, rowsProcessed);
        }
      },
      complete: () => {
        if (onProgress) {
          onProgress(100, rowsProcessed);
        }
        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const validateCSVFile = (
  file: File,
): { valid: boolean; error?: string } => {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { valid: false, error: "Only CSV files are allowed" };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true };
};
