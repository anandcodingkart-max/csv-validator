import { ValidationResult, ValidationError } from "@/types";

// Required fields as per Driftcharge specifications
export const REQUIRED_FIELDS = [
  "subscription_contract_id",
  "customer_id",
  "customer_name",
  "customer_email",
  "status",
  "billing_interval",
  "billing_interval_count",
  "billing_min_cycles",
  "billing_max_cycles",
  "delivery_interval",
  "delivery_interval_count",
  "quantity",
  "price",
  "next_billing_date",
  "product_id",
  "variant_id",
] as const;

// Fields that require at least one to be present
export const OPTIONAL_GROUP_FIELDS = [
  "customer_id",
  "customer_name",
  "customer_email",
  "status",
  "billing_interval",
  "billing_interval_count",
  "billing_min_cycles",
  "billing_max_cycles",
  "delivery_interval",
  "delivery_interval_count",
  "quantity",
  "price",
  "next_billing_date",
  "product_id",
  "variant_id",
] as const;

export type RequiredField = (typeof REQUIRED_FIELDS)[number];

export interface HeaderValidationResult {
  isValid: boolean;
  missingFields: string[];
  extraFields: string[];
}

export interface RowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  summary: {
    totalRecords: number;
    successCount: number;
    failedCount: number;
    successRate: number;
  };
}

// Shopify-specific validation patterns
const SHOPIFY_CONTRACT_ID_PATTERN =
  /^gid:\/\/shopify\/SubscriptionContract\/\d+$/;
const SHOPIFY_CUSTOMER_ID_PATTERN = /^gid:\/\/shopify\/Customer\/\d+$/;
const SHOPIFY_PRODUCT_ID_PATTERN = /^gid:\/\/shopify\/Product\/\d+$/;
const SHOPIFY_VARIANT_ID_PATTERN = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

// Shopify allowed statuses
const SHOPIFY_STATUSES = [
  "active",
  "cancelled",
  "expired",
  "paused",
  "pending",
] as const;

// Shopify allowed intervals
const SHOPIFY_INTERVALS = ["day", "week", "month", "year"] as const;

// Convert CSV rows to array of objects
export const convertToObjects = (
  headers: string[],
  rows: string[][],
): Record<string, any>[] => {
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });
};

// Validate Shopify GraphQL ID
const isValidShopifyId = (
  value: string,
  pattern: RegExp,
  type: string,
  isRequired: boolean = false,
): { isValid: boolean; error?: string } => {
  if (!value || value.trim() === "") {
    if (isRequired) {
      return { isValid: false, error: `${type} ID is required` };
    }
    return { isValid: true }; // Optional field, empty is allowed
  }

  const trimmedValue = value.trim();
  if (!pattern.test(trimmedValue)) {
    const expectedPattern = `gid://shopify/${type}/[id]`;
    return {
      isValid: false,
      error: `Invalid ${type} ID format. Expected: ${expectedPattern}`,
    };
  }

  return { isValid: true };
};

// Validate number (supports both integer and string numbers)
const isValidNumber = (
  value: any,
  positive: boolean = false,
  allowZero: boolean = true,
  isRequired: boolean = false,
): { isValid: boolean; error?: string } => {
  if (value === undefined || value === null || value === "") {
    if (isRequired) {
      return { isValid: false, error: "Value is required" };
    }
    return { isValid: true }; // Optional field, empty is allowed
  }

  let numValue: number;

  if (typeof value === "number") {
    numValue = value;
  } else if (typeof value === "string") {
    if (value.trim() === "") {
      return { isValid: true }; // Empty string is allowed for optional fields
    }

    const numberRegex = /^-?\d+(\.\d+)?$/;
    if (!numberRegex.test(value.trim())) {
      return { isValid: false, error: "Must be a valid number" };
    }
    numValue = parseFloat(value);
  } else {
    return { isValid: false, error: "Must be a number" };
  }

  if (isNaN(numValue)) {
    return { isValid: false, error: "Must be a valid number" };
  }

  if (positive && numValue <= 0) {
    return { isValid: false, error: "Must be greater than 0" };
  }

  if (!allowZero && numValue === 0) {
    return { isValid: false, error: "Cannot be zero" };
  }

  return { isValid: true, error: undefined };
};

// Validate price
const isValidPrice = (
  value: any,
  isRequired: boolean = false,
): { isValid: boolean; error?: string } => {
  if (value === undefined || value === null || value === "") {
    if (isRequired) {
      return { isValid: false, error: "Price is required" };
    }
    return { isValid: true };
  }

  let numValue: number;

  if (typeof value === "number") {
    numValue = value;
  } else if (typeof value === "string") {
    if (value.trim() === "") {
      return { isValid: true };
    }
    const priceRegex = /^-?\d+(\.\d+)?$/;
    if (!priceRegex.test(value.trim())) {
      return {
        isValid: false,
        error: "Price must be a valid number (e.g., 10.54, 100, 0.99)",
      };
    }
    numValue = parseFloat(value);
  } else {
    return { isValid: false, error: "Price must be a number" };
  }

  if (isNaN(numValue)) {
    return { isValid: false, error: "Invalid price format" };
  }

  return { isValid: true };
};

// Validate date
const isValidShopifyDate = (
  value: string,
  isRequired: boolean = false,
): { isValid: boolean; error?: string } => {
  if (!value || value.trim() === "") {
    if (isRequired) {
      return { isValid: false, error: "Next billing date is required" };
    }
    return { isValid: true };
  }

  const trimmedValue = value.trim();

  const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (simpleDateRegex.test(trimmedValue)) {
    const date = new Date(trimmedValue);
    if (!isNaN(date.getTime())) {
      return { isValid: true };
    }
  }

  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (isoDateTimeRegex.test(trimmedValue)) {
    const date = new Date(trimmedValue);
    if (!isNaN(date.getTime())) {
      return { isValid: true };
    }
  }

  const isoWithOffsetRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?[+-]\d{2}:\d{2}$/;
  if (isoWithOffsetRegex.test(trimmedValue)) {
    const date = new Date(trimmedValue);
    if (!isNaN(date.getTime())) {
      return { isValid: true };
    }
  }

  return {
    isValid: false,
    error:
      "Invalid date format. Expected: YYYY-MM-DD or Shopify ISO format (e.g., 2026-04-01T10:00:00Z)",
  };
};

// Check if at least one of the optional fields is provided
const hasAtLeastOneOptionalField = (
  row: Record<string, any>,
): { isValid: boolean; providedFields: string[] } => {
  const providedFields: string[] = [];

  for (const field of OPTIONAL_GROUP_FIELDS) {
    const value = row[field];
    if (
      value !== undefined &&
      value !== null &&
      value.toString().trim() !== ""
    ) {
      providedFields.push(field);
    }
  }

  return {
    isValid: providedFields.length > 0,
    providedFields,
  };
};

// Checkpoint 1: Validate Headers
export const validateHeaders = (headers: string[]): HeaderValidationResult => {
  // Normalize headers to lowercase for comparison
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  const requiredField = "subscription_contract_id";
  const optionalFields = REQUIRED_FIELDS.filter((f) => f !== requiredField);

  const hasRequiredField = normalizedHeaders.includes(requiredField);

  // Find missing optional fields (for informational purposes only)
  const missingOptionalFields = optionalFields.filter(
    (field) => !normalizedHeaders.includes(field),
  );

  // Find extra fields (fields not in REQUIRED_FIELDS)
  const requiredSet = new Set(REQUIRED_FIELDS);
  const extraFields = headers.filter(
    (header) => !requiredSet.has(header.toLowerCase().trim()),
  );

  return {
    isValid: hasRequiredField, // Only require subscription_contract_id
    missingFields: hasRequiredField ? [] : [requiredField],
    extraFields,
    missingOptionalFields, // Add this for informational display
  };
};
// Shopify-specific validation rules (all optional except subscription_contract_id)
export const validationRules = {
  subscription_contract_id: {
    type: "shopify_contract_id",
    required: true,
    validate: (value: any) =>
      isValidShopifyId(
        value,
        SHOPIFY_CONTRACT_ID_PATTERN,
        "SubscriptionContract",
        true,
      ),
    message:
      "Subscription Contract ID is required and must be a valid Shopify ID (gid://shopify/SubscriptionContract/{id})",
  },
  customer_id: {
    type: "shopify_customer_id",
    required: false,
    validate: (value: any) =>
      isValidShopifyId(value, SHOPIFY_CUSTOMER_ID_PATTERN, "Customer", false),
    message:
      "Must be a valid Shopify Customer ID (gid://shopify/Customer/{id})",
  },
  customer_name: {
    type: "string",
    required: false,
    validate: (value: any) => {
      if (!value || value.trim() === "") {
        return { isValid: true }; // Optional
      }
      if (typeof value !== "string") {
        return { isValid: false, error: "Customer name must be a string" };
      }
      return { isValid: true };
    },
    message: "Customer name must be a string",
  },
  customer_email: {
    type: "email",
    required: false,
    validate: (value: any) => {
      if (!value || value.trim() === "") {
        return { isValid: true }; // Optional
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(value.trim());
      return {
        isValid,
        error: isValid ? undefined : "Invalid email format",
      };
    },
    message: "Must be a valid email address",
  },
  status: {
    type: "enum",
    values: SHOPIFY_STATUSES,
    required: false,
    validate: (value: any) => {
      if (!value || value.trim() === "") {
        return { isValid: true }; // Optional
      }
      const isValid = SHOPIFY_STATUSES.includes(value.toLowerCase() as any);
      return {
        isValid,
        error: isValid
          ? undefined
          : `Status must be one of: ${SHOPIFY_STATUSES.join(", ")}`,
      };
    },
    message: `Status must be one of: ${SHOPIFY_STATUSES.join(", ")}`,
  },
  billing_interval: {
    type: "enum",
    values: SHOPIFY_INTERVALS,
    required: false,
    validate: (value: any) => {
      if (!value || value.trim() === "") {
        return { isValid: true }; // Optional
      }
      const isValid = SHOPIFY_INTERVALS.includes(value.toLowerCase() as any);
      return {
        isValid,
        error: isValid
          ? undefined
          : `Billing interval must be one of: ${SHOPIFY_INTERVALS.join(", ")}`,
      };
    },
    message: `Must be one of: ${SHOPIFY_INTERVALS.join(", ")}`,
  },
  billing_interval_count: {
    type: "number",
    positive: true,
    required: false,
    validate: (value: any) => isValidNumber(value, true, false, false),
    message: "Must be a positive integer (e.g., 1, 2, 3)",
  },
  billing_min_cycles: {
    type: "number",
    positive: false,
    required: false,
    validate: (value: any) => isValidNumber(value, false, true, false),
    message: "Must be a valid number",
  },
  billing_max_cycles: {
    type: "number",
    positive: false,
    required: false,
    validate: (value: any) => isValidNumber(value, false, true, false),
    message: "Must be a valid number",
  },
  delivery_interval: {
    type: "enum",
    values: SHOPIFY_INTERVALS,
    required: false,
    validate: (value: any) => {
      if (!value || value.trim() === "") {
        return { isValid: true }; // Optional
      }
      const isValid = SHOPIFY_INTERVALS.includes(value.toLowerCase() as any);
      return {
        isValid,
        error: isValid
          ? undefined
          : `Delivery interval must be one of: ${SHOPIFY_INTERVALS.join(", ")}`,
      };
    },
    message: `Must be one of: ${SHOPIFY_INTERVALS.join(", ")}`,
  },
  delivery_interval_count: {
    type: "number",
    positive: true,
    required: false,
    validate: (value: any) => isValidNumber(value, true, false, false),
    message: "Must be a positive integer (e.g., 1, 2, 3)",
  },
  quantity: {
    type: "number",
    positive: true,
    required: false,
    validate: (value: any) => isValidNumber(value, true, false, false),
    message: "Must be a positive integer (e.g., 1, 2, 3)",
  },
  price: {
    type: "price",
    required: false,
    validate: (value: any) => isValidPrice(value, false),
    message: "Must be a valid price (e.g., 10.54, 100, 0.99)",
  },
  next_billing_date: {
    type: "date",
    required: false,
    validate: (value: any) => isValidShopifyDate(value, false),
    message: "Must be a valid date (YYYY-MM-DD or Shopify ISO format)",
  },
  product_id: {
    type: "shopify_product_id",
    required: false,
    validate: (value: any) =>
      isValidShopifyId(value, SHOPIFY_PRODUCT_ID_PATTERN, "Product", false),
    message: "Must be a valid Shopify Product ID (gid://shopify/Product/{id})",
  },
  variant_id: {
    type: "shopify_variant_id",
    required: false,
    validate: (value: any) =>
      isValidShopifyId(
        value,
        SHOPIFY_VARIANT_ID_PATTERN,
        "ProductVariant",
        false,
      ),
    message:
      "Must be a valid Shopify Product Variant ID (gid://shopify/ProductVariant/{id})",
  },
};

// Validation for unique subscription_contract_id
const validateUniqueContractIds = (
  data: Record<string, any>[],
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const contractIdMap = new Map<string, number[]>();

  data.forEach((row, index) => {
    const contractId = row.subscription_contract_id;
    if (contractId && contractId.toString().trim() !== "") {
      if (!contractIdMap.has(contractId)) {
        contractIdMap.set(contractId, []);
      }
      contractIdMap.get(contractId)!.push(index + 2);
    }
  });

  contractIdMap.forEach((rows, contractId) => {
    if (rows.length > 1) {
      rows.forEach((rowNum) => {
        errors.push({
          row: rowNum,
          column: "subscription_contract_id",
          value: contractId,
          error: `Duplicate subscription_contract_id found. This ID appears in ${rows.length} rows: ${rows.join(", ")}`,
          severity: "error",
        });
      });
    }
  });

  return errors;
};

// Validation for intervals match
const validateIntervalsMatch = (
  data: Record<string, any>[],
): ValidationError[] => {
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    const billingInterval = row.billing_interval;
    const deliveryInterval = row.delivery_interval;

    // Only validate if both are provided
    if (
      billingInterval &&
      deliveryInterval &&
      billingInterval.toString().trim() !== "" &&
      deliveryInterval.toString().trim() !== ""
    ) {
      const billingIntervalStr = billingInterval
        .toString()
        .toLowerCase()
        .trim();
      const deliveryIntervalStr = deliveryInterval
        .toString()
        .toLowerCase()
        .trim();

      if (billingIntervalStr !== deliveryIntervalStr) {
        errors.push({
          row: index + 2,
          column: "delivery_interval",
          value: deliveryIntervalStr,
          error: `Delivery interval (${deliveryIntervalStr}) must match billing interval (${billingIntervalStr})`,
          severity: "error",
        });
      }
    }
  });

  return errors;
};

// Validation for interval counts
const validateIntervalCounts = (
  data: Record<string, any>[],
): ValidationError[] => {
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    const billingIntervalCount = row.billing_interval_count;
    const deliveryIntervalCount = row.delivery_interval_count;
    const billingInterval = row.billing_interval;
    const deliveryInterval = row.delivery_interval;

    // Validate billing_interval_count if provided
    if (
      billingIntervalCount !== undefined &&
      billingIntervalCount !== null &&
      billingIntervalCount !== ""
    ) {
      let count: number;
      if (typeof billingIntervalCount === "number") {
        count = billingIntervalCount;
      } else if (typeof billingIntervalCount === "string") {
        const num = parseFloat(billingIntervalCount);
        if (isNaN(num)) {
          errors.push({
            row: index + 2,
            column: "billing_interval_count",
            value: billingIntervalCount,
            error: "Billing interval count must be a valid number",
            severity: "error",
          });
          return;
        }
        count = num;
      } else {
        errors.push({
          row: index + 2,
          column: "billing_interval_count",
          value: String(billingIntervalCount),
          error: "Billing interval count must be a number",
          severity: "error",
        });
        return;
      }

      if (billingInterval && billingInterval.toString().trim() !== "") {
        const interval = billingInterval.toString().toLowerCase().trim();
        if (interval === "day" && count > 365) {
          errors.push({
            row: index + 2,
            column: "billing_interval_count",
            value: String(count),
            error: "For daily billing, interval count cannot exceed 365 days",
            severity: "error",
          });
        } else if (interval === "week" && count > 52) {
          errors.push({
            row: index + 2,
            column: "billing_interval_count",
            value: String(count),
            error: "For weekly billing, interval count cannot exceed 52 weeks",
            severity: "error",
          });
        } else if (interval === "month" && count > 12) {
          errors.push({
            row: index + 2,
            column: "billing_interval_count",
            value: String(count),
            error:
              "For monthly billing, interval count cannot exceed 12 months",
            severity: "error",
          });
        } else if (interval === "year" && count > 10) {
          errors.push({
            row: index + 2,
            column: "billing_interval_count",
            value: String(count),
            error: "For yearly billing, interval count cannot exceed 10 years",
            severity: "error",
          });
        }
      }
    }

    // Validate delivery_interval_count if provided
    if (
      deliveryIntervalCount !== undefined &&
      deliveryIntervalCount !== null &&
      deliveryIntervalCount !== ""
    ) {
      let count: number;
      if (typeof deliveryIntervalCount === "number") {
        count = deliveryIntervalCount;
      } else if (typeof deliveryIntervalCount === "string") {
        const num = parseFloat(deliveryIntervalCount);
        if (isNaN(num)) {
          errors.push({
            row: index + 2,
            column: "delivery_interval_count",
            value: deliveryIntervalCount,
            error: "Delivery interval count must be a valid number",
            severity: "error",
          });
          return;
        }
        count = num;
      } else {
        errors.push({
          row: index + 2,
          column: "delivery_interval_count",
          value: String(deliveryIntervalCount),
          error: "Delivery interval count must be a number",
          severity: "error",
        });
        return;
      }

      if (deliveryInterval && deliveryInterval.toString().trim() !== "") {
        const interval = deliveryInterval.toString().toLowerCase().trim();
        if (interval === "day" && count > 365) {
          errors.push({
            row: index + 2,
            column: "delivery_interval_count",
            value: String(count),
            error: "For daily delivery, interval count cannot exceed 365 days",
            severity: "error",
          });
        } else if (interval === "week" && count > 52) {
          errors.push({
            row: index + 2,
            column: "delivery_interval_count",
            value: String(count),
            error: "For weekly delivery, interval count cannot exceed 52 weeks",
            severity: "error",
          });
        } else if (interval === "month" && count > 12) {
          errors.push({
            row: index + 2,
            column: "delivery_interval_count",
            value: String(count),
            error:
              "For monthly delivery, interval count cannot exceed 12 months",
            severity: "error",
          });
        } else if (interval === "year" && count > 10) {
          errors.push({
            row: index + 2,
            column: "delivery_interval_count",
            value: String(count),
            error: "For yearly delivery, interval count cannot exceed 10 years",
            severity: "error",
          });
        }
      }
    }
  });

  return errors;
};

// Validate a single field value using Shopify rules
const validateFieldValue = (
  field: string,
  value: any,
  rules: any,
): { isValid: boolean; error?: string } => {
  const rule = rules[field];
  if (!rule) return { isValid: true };

  // Use the rule's validate method which now handles optional fields correctly
  if (rule.validate) {
    return rule.validate(value);
  }

  return { isValid: true };
};

// Checkpoint 2: Validate Rows with all Shopify rules
export const validateRows = (
  data: Record<string, any>[],
): RowValidationResult => {
  const errors: ValidationError[] = [];
  let successCount = 0;
  let failedCount = 0;

  // First, validate individual fields and the "at least one optional field" rule
  data.forEach((row, rowIndex) => {
    let rowHasError = false;

    // Validate subscription_contract_id (required)
    const contractIdValidation = validateFieldValue(
      "subscription_contract_id",
      row.subscription_contract_id,
      validationRules,
    );
    if (!contractIdValidation.isValid) {
      errors.push({
        row: rowIndex + 2,
        column: "subscription_contract_id",
        value: String(row.subscription_contract_id || ""),
        error: contractIdValidation.error || "Invalid subscription contract ID",
        severity: "error",
      });
      rowHasError = true;
    }

    // Validate all other fields (optional)
    for (const field of OPTIONAL_GROUP_FIELDS) {
      const value = row[field];
      const validation = validateFieldValue(field, value, validationRules);

      if (!validation.isValid) {
        errors.push({
          row: rowIndex + 2,
          column: field,
          value: String(value || ""),
          error: validation.error || `Invalid value for ${field}`,
          severity: "error",
        });
        rowHasError = true;
      }
    }

    // Check if at least one optional field is provided
    const optionalCheck = hasAtLeastOneOptionalField(row);
    if (!optionalCheck.isValid) {
      errors.push({
        row: rowIndex + 2,
        column: "optional_fields",
        value: "No optional fields provided",
        error: `At least one of these fields is required: ${OPTIONAL_GROUP_FIELDS.join(", ")}`,
        severity: "error",
      });
      rowHasError = true;
    }

    if (rowHasError) {
      failedCount++;
    } else {
      successCount++;
    }
  });

  // Add cross-row validations
  const uniqueContractErrors = validateUniqueContractIds(data);
  const intervalsMatchErrors = validateIntervalsMatch(data);
  const intervalCountErrors = validateIntervalCounts(data);

  // Combine all errors
  const allErrors = [
    ...errors,
    ...uniqueContractErrors,
    ...intervalsMatchErrors,
    ...intervalCountErrors,
  ];

  // Recalculate success/failed counts based on all errors
  const rowsWithErrors = new Set(allErrors.map((e) => e.row));
  const finalSuccessCount = data.length - rowsWithErrors.size;
  const finalFailedCount = rowsWithErrors.size;

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    summary: {
      totalRecords: data.length,
      successCount: finalSuccessCount,
      failedCount: finalFailedCount,
      successRate:
        data.length > 0 ? (finalSuccessCount / data.length) * 100 : 0,
    },
  };
};
