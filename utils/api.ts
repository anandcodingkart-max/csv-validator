import axios from "axios";

const API_BASE_URL = "http://localhost:8000/v1/bulk-operation";
const SHOP = "checkout-ui-build.myshopify.com";

export interface SaveSubscriptionData {
  shop: string;
  finalFlag: boolean;
  data: Record<string, any>[];
}

export interface VerificationStatus {
  status: string;
  statusCode: number;
  data: {
    message: string;
    status: "Pending" | "Processing" | "Success" | "Failed";
    errorCsvUrl?: string;
  };
}

// Save subscription data in chunks
export const saveSubscriptionData = async (
  data: SaveSubscriptionData,
): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/save-update-subscription-csv-data`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Error saving subscription data:", error);
    throw error;
  }
};

// Get verification status
export const getVerificationStatus = async (): Promise<VerificationStatus> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/get-update-subscription-verification-status?shop=${SHOP}`,
    );
    console.log("Verification status response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting verification status:", error);
    throw error;
  }
};
