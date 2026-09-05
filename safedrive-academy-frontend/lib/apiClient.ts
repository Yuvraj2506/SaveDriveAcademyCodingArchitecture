import { CleanStudentData, CleanPendingRequest, CleanPaymentRecord } from "@/types";

export interface ApiResponseEnvelope<T> {
  StatusCode: number;
  Success: boolean;
  Message: string;
  Data: T | null;
  Errors: string[] | null;
  Timestamp: string;
}

export interface UserSessionDTO {
  Id: string;
  PhoneNumber: string;
  FullName: string;
  Role: "student" | "admin_staff" | "admin_owner" | string;
  IsActive: boolean;
}

export interface LoginResultDTO {
  Token: string;
  User: UserSessionDTO;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("safedrive_auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export function formatFriendlyError(error: unknown, fallbackMessage: string = "An unexpected error occurred. Please try again."): string {
  if (typeof error === "string") {
    return translateTechnicalMessage(error);
  }

  if (error instanceof Error) {
    if (error.name === "TypeError" && error.message.toLowerCase().includes("fetch")) {
      return "Unable to connect to the SafeDrive server. Please ensure the backend is running and check your network connection.";
    }
    return translateTechnicalMessage(error.message);
  }

  return fallbackMessage;
}

function translateTechnicalMessage(raw: string): string {
  const text = raw.toLowerCase();

  if (text.includes("failed to fetch") || text.includes("network error") || text.includes("econnrefused")) {
    return "Unable to connect to the SafeDrive server. Please ensure the backend is running and check your network connection.";
  }

  if (text.includes("invalid credentials") || text.includes("invalid phone number or password")) {
    return "Incorrect mobile number or password. Please double-check your credentials and try again.";
  }

  if (text.includes("10-digit") || text.includes("phone number is required")) {
    return "Please enter a valid 10-digit Indian mobile number.";
  }

  if (text.includes("at least 8 characters") || text.includes("password is required")) {
    return "Password must be at least 8 characters long.";
  }

  if (text.includes("account is deactivated")) {
    return "Your account has been deactivated. Please contact the academy administration.";
  }

  if (text.includes("body cannot be empty")) {
    return "Please fill in all required fields.";
  }

  return raw;
}

export const apiClient = {
  // Authentication
  async login(phoneNumber: string, password: string): Promise<LoginResultDTO> {
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/authentication/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          PhoneNumber: cleanPhone,
          Password: password,
        }),
      });
    } catch (networkError) {
      throw new Error(formatFriendlyError(networkError));
    }

    let result: ApiResponseEnvelope<LoginResultDTO>;
    try {
      result = await response.json();
    } catch {
      throw new Error("Received an unreadable response from the server. Please try again.");
    }

    if (!response.ok || !result.Success || !result.Data) {
      const serverMessage = result.Errors?.[0] || result.Message || "Login failed.";
      throw new Error(formatFriendlyError(serverMessage));
    }

    return result.Data;
  },

  // Students
  async getStudents(): Promise<CleanStudentData[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/students`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const result: ApiResponseEnvelope<CleanStudentData[]> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to fetch students.");
      }
      return result.Data || [];
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async getStudentByPhone(phone: string): Promise<CleanStudentData> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/students/${encodeURIComponent(phone)}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const result: ApiResponseEnvelope<CleanStudentData> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        throw new Error(result.Message || "Student record not found.");
      }
      return result.Data;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async updateStudentKm(idOrPhone: string, completedKm: number): Promise<CleanStudentData> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/students/${encodeURIComponent(idOrPhone)}/km`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ CompletedKm: completedKm }),
      });
      const result: ApiResponseEnvelope<CleanStudentData> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        throw new Error(result.Message || "Failed to update kilometers.");
      }
      return result.Data;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async updateStudentDays(idOrPhone: string, completedDays: number): Promise<CleanStudentData> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/students/${encodeURIComponent(idOrPhone)}/days`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ CompletedDays: completedDays }),
      });
      const result: ApiResponseEnvelope<CleanStudentData> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        throw new Error(result.Message || "Failed to update days.");
      }
      return result.Data;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async deleteStudent(idOrPhone: string): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/students/${encodeURIComponent(idOrPhone)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result: ApiResponseEnvelope<null> = await response.json();
      return !!result.Success;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  // Pending Requests
  async getPendingRequests(): Promise<CleanPendingRequest[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/requests`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const result: ApiResponseEnvelope<CleanPendingRequest[]> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to fetch pending requests.");
      }
      return result.Data || [];
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async createRequest(requestData: Partial<CleanPendingRequest>): Promise<CleanPendingRequest> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/requests`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData),
      });
      const result: ApiResponseEnvelope<CleanPendingRequest> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        throw new Error(result.Message || "Failed to submit request.");
      }
      return result.Data;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async approveRequest(requestId: string): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/requests/${encodeURIComponent(requestId)}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const result: ApiResponseEnvelope<null> = await response.json();
      return !!result.Success;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async rejectRequest(requestId: string): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/requests/${encodeURIComponent(requestId)}/reject`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const result: ApiResponseEnvelope<null> = await response.json();
      return !!result.Success;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },
};