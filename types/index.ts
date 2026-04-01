export interface CSVData {
  headers: string[];
  rows: string[][];
  fileName: string;
  dataObjects?: Record<string, string>[];
}

export interface ParsingProgress {
  percentage: number;
  rowsProcessed: number;
  status: "idle" | "parsing" | "complete" | "error";
  error?: string;
}

export interface ValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
  severity: "error" | "warning" | "info";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    affectedRows: number;
  };
}
