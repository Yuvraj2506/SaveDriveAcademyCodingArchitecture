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
  RefreshToken?: string;
  User: UserSessionDTO;
}

export interface RefreshTokenResultDTO {
  Token: string;
  RefreshToken: string;
}

export interface VerifyPhoneResultDTO {
  PhoneNumber: string;
  FullName: string;
  Status: string;
  IsApproved: boolean;
}

export const AUTH_KEYS = {
  ACCESS_TOKEN: "safedrive_access_token",
  REFRESH_TOKEN: "safedrive_refresh_token",
  USER: "safedrive_user",
} as const;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN) || localStorage.getItem("safedrive_auth_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
}

export function getCurrentUser(): UserSessionDTO | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem("safedrive_auth_token", accessToken); // backward-compatible alias
  if (refreshToken) {
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(AUTH_KEYS.USER);
  localStorage.removeItem("safedrive_auth_token");
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (netErr) {
    throw new Error(formatFriendlyError(netErr));
  }

  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/?login=true";
      }
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${BACKEND_URL}/api/authentication/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ RefreshToken: refreshToken }),
        });

        const refreshResult: ApiResponseEnvelope<RefreshTokenResultDTO> = await refreshResponse.json();
        if (refreshResponse.ok && refreshResult.Success && refreshResult.Data) {
          setTokens(refreshResult.Data.Token, refreshResult.Data.RefreshToken);
          onRefreshed(refreshResult.Data.Token);
          isRefreshing = false;

          headers.set("Authorization", `Bearer ${refreshResult.Data.Token}`);
          return fetch(url, { ...options, headers });
        } else {
          clearAuthSession();
          onRefreshed(null);
          isRefreshing = false;
          if (typeof window !== "undefined" && window.location.pathname !== "/") {
            window.location.href = "/?login=true";
          }
          return response;
        }
      } catch {
        clearAuthSession();
        onRefreshed(null);
        isRefreshing = false;
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/?login=true";
        }
        return response;
      }
    } else {
      return new Promise<Response>((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            const retried = await fetch(url, { ...options, headers });
            resolve(retried);
          } else {
            resolve(response);
          }
        });
      });
    }
  }

  return response;
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

  if (text.includes("awaiting owner approval")) {
    return "Your registration request is awaiting Owner approval. Please wait for approval before activating your account.";
  }

  if (text.includes("declined") || text.includes("rejected")) {
    return "Your registration request was declined. Please contact academy office.";
  }

  if (text.includes("no registration found")) {
    return "No registration found for this mobile number. Please register with our staff.";
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

  if (text.includes("invalid or expired refresh token")) {
    return "Your session has expired. Please log in again.";
  }

  return raw;
}

function mapToCleanPendingRequest(item: any): CleanPendingRequest {
  const isApproved = item.Status === "Approved" || item.status === "Approved";
  const isRejected = item.Status === "Rejected" || item.status === "Rejected";
  let displayStatus = "Pending Owner Approval";
  if (isApproved) displayStatus = "Approved";
  if (isRejected) displayStatus = "Rejected";

  return {
    id: item.Id || item._id || item.id,
    requestId: item.Id ? `REQ-${item.Id.slice(-4).toUpperCase()}` : (item.requestId || "REQ-0000"),
    name: item.Name || item.name || "Student",
    studentName: item.Name || item.name || "Student",
    phone: item.PhoneNumber || item.phone || "",
    course: item.VehicleType || item.course || "4-Wheeler",
    coursePackage: item.CoursePackage || item.coursePackage || "Standard Course",
    categoryOption: item.CoursePackage || item.categoryOption || "Standard Course",
    trainingType: item.TrainingType || item.trainingType || "4w_personal",
    targetKm: item.TargetKm ?? item.targetKm ?? 0,
    amountPaid: item.TotalPaid ?? item.amountPaid ?? 0,
    amountDue: item.RemainingDue ?? item.amountDue ?? 0,
    totalFee: item.TotalCourseFee ?? item.totalFee ?? 0,
    paymentMethod: item.PaymentMethod || item.paymentMethod || "UPI",
    instructor: item.AssignedInstructor || item.instructor || "Staff Desk",
    requestedBy: item.RequestedBy || item.requestedBy || "Staff Member",
    requestedDate: item.RequestedDate || item.requestedDate || new Date().toLocaleDateString("en-IN"),
    status: displayStatus,
    subOption: item.CoursePackage,
  };
}

function mapToCleanStudentData(item: any): CleanStudentData {
  const remDue = item.RemainingDue ?? item.remainingDue ?? 0;
  return {
    id: item.Id || item._id || item.id,
    name: item.Name || item.name,
    phone: item.PhoneNumber || item.phone,
    vehicleType: item.VehicleType || item.vehicleType || "4-Wheeler",
    coursePackage: item.CoursePackage || item.coursePackage || "Standard Course",
    trainingType: item.TrainingType || item.trainingType || "4w_personal",
    targetKm: item.TargetKm ?? item.targetKm ?? 0,
    completedKm: item.CompletedKm ?? item.completedKm ?? 0,
    totalDays: item.TotalDays ?? item.totalDays ?? 15,
    completedDays: item.CompletedDays ?? item.completedDays ?? 0,
    totalCourseFee: item.TotalCourseFee ?? item.totalCourseFee ?? 0,
    totalPaid: item.TotalPaid ?? item.totalPaid ?? 0,
    remainingDue: remDue,
    assignedInstructor: item.AssignedInstructor || item.assignedInstructor || "Staff Trainer",
    status: (item.Status || item.status || "active").toLowerCase(),
    registrationDate: item.RequestedDate || item.ApprovedDate || item.registrationDate,
    dueDateNote: remDue > 0 ? `Remaining ₹${remDue.toLocaleString("en-IN")} due before final test.` : "Fully paid.",
    payments: (item.Payments || item.payments || []).map((p: any) => ({
      receiptNumber: p.ReceiptNumber || p.receiptNumber || "REC-001",
      date: p.Date || p.date || "",
      method: p.Method || p.method || "UPI",
      amount: p.Amount ?? p.amount ?? 0,
      recordedBy: p.RecordedBy || p.recordedBy || "Staff Member"
    }))
  };
}

export const apiClient = {
  // Authentication & Session
  async login(phoneNumber: string, password: string): Promise<LoginResultDTO> {
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/authentication/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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

  async verifyStudentPhone(phoneNumber: string): Promise<VerifyPhoneResultDTO> {
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/authentication/verify-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ PhoneNumber: cleanPhone }),
      });
    } catch (netErr) {
      throw new Error(formatFriendlyError(netErr));
    }

    let result: ApiResponseEnvelope<VerifyPhoneResultDTO>;
    try {
      result = await response.json();
    } catch {
      throw new Error("Received an unreadable response from the server.");
    }

    if (!response.ok || !result.Success || !result.Data) {
      const errorMsg = result.Errors?.[0] || result.Message || "Phone verification failed.";
      throw new Error(formatFriendlyError(errorMsg));
    }

    return result.Data;
  },

  async setStudentPassword(phoneNumber: string, password: string): Promise<LoginResultDTO> {
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/authentication/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          PhoneNumber: cleanPhone,
          Password: password,
        }),
      });
    } catch (netErr) {
      throw new Error(formatFriendlyError(netErr));
    }

    let result: ApiResponseEnvelope<LoginResultDTO>;
    try {
      result = await response.json();
    } catch {
      throw new Error("Received an unreadable response from the server.");
    }

    if (!response.ok || !result.Success || !result.Data) {
      const errorMsg = result.Errors?.[0] || result.Message || "Failed to set password.";
      throw new Error(formatFriendlyError(errorMsg));
    }

    return result.Data;
  },

  async refreshToken(): Promise<RefreshTokenResultDTO | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${BACKEND_URL}/api/authentication/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ RefreshToken: refreshToken }),
      });

      const result: ApiResponseEnvelope<RefreshTokenResultDTO> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        return null;
      }

      setTokens(result.Data.Token, result.Data.RefreshToken);
      return result.Data;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      const refreshToken = getRefreshToken();
      const accessToken = getAccessToken();
      try {
        await fetch(`${BACKEND_URL}/api/authentication/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ RefreshToken: refreshToken || "" }),
        });
      } catch (err) {
        console.warn("Logout error:", err);
      } finally {
        clearAuthSession();
      }
    }
  },

  // Staff Feature API
  async createStaffStudentRequest(requestData: Partial<CleanPendingRequest>): Promise<CleanPendingRequest> {
    const user = getCurrentUser();
    const staffName = user?.FullName || "Ramesh Kumar (Staff)";

    const cleanPhone = (requestData.phone || "").replace(/\D/g, "").slice(-10);

    const payload = {
      Name: requestData.name?.trim(),
      PhoneNumber: cleanPhone,
      VehicleType: requestData.course || requestData.vehicleType || "4-Wheeler",
      CoursePackage: requestData.categoryOption || requestData.coursePackage || "Standard Course",
      TrainingType: requestData.trainingType || "4w_personal",
      TargetKm: requestData.targetKm || (requestData.course?.includes("4-Wheeler") ? 120 : 0),
      TotalCourseFee: (requestData.amountPaid || 0) + (requestData.amountDue || 0),
      TotalPaid: requestData.amountPaid || 0,
      RemainingDue: requestData.amountDue || 0,
      AssignedInstructor: requestData.instructor || staffName,
      PaymentMethod: requestData.paymentMethod || "UPI",
      RequestedBy: staffName,
    };

    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/staff/student-requests`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result: ApiResponseEnvelope<any> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        throw new Error(result.Message || "Failed to submit student request.");
      }

      return mapToCleanPendingRequest(result.Data);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async getStaffStudentRequests(): Promise<CleanPendingRequest[]> {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/staff/student-requests`, {
        method: "GET",
      });
      const result: ApiResponseEnvelope<any[]> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to fetch student requests.");
      }
      return (result.Data || []).map(mapToCleanPendingRequest);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async getStaffStudents(): Promise<CleanStudentData[]> {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/staff/students`, {
        method: "GET",
      });
      const result: ApiResponseEnvelope<any[]> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to fetch students.");
      }
      return (result.Data || []).map(mapToCleanStudentData);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  // Owner Feature API
  async getOwnerStudentRequests(): Promise<CleanPendingRequest[]> {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/owner/student-requests`, {
        method: "GET",
      });
      const result: ApiResponseEnvelope<any[]> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to fetch owner requests.");
      }
      return (result.Data || []).map(mapToCleanPendingRequest);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async approveOwnerStudentRequest(idOrPhone: string): Promise<CleanPendingRequest> {
    const user = getCurrentUser();
    const ownerName = user?.FullName || "Yuvraj Gupta (Owner)";

    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/owner/student-requests/${encodeURIComponent(idOrPhone)}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ ApprovedBy: ownerName }),
        }
      );

      const result: ApiResponseEnvelope<any> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        throw new Error(result.Message || "Failed to approve student request.");
      }

      return mapToCleanPendingRequest(result.Data);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async rejectOwnerStudentRequest(idOrPhone: string, reason?: string): Promise<CleanPendingRequest> {
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/owner/student-requests/${encodeURIComponent(idOrPhone)}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ RejectionReason: reason || "Declined by owner" }),
        }
      );

      const result: ApiResponseEnvelope<any> = await response.json();
      if (!response.ok || !result.Success || !result.Data) {
        throw new Error(result.Message || "Failed to reject student request.");
      }

      return mapToCleanPendingRequest(result.Data);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async getOwnerStudents(): Promise<CleanStudentData[]> {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}/api/owner/students`, {
        method: "GET",
      });
      const result: ApiResponseEnvelope<any[]> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to fetch students.");
      }
      return (result.Data || []).map(mapToCleanStudentData);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  // Role-Aware General Convenience Methods
  async getStudents(): Promise<CleanStudentData[]> {
    const user = getCurrentUser();
    if (user?.Role === "admin_owner") {
      return this.getOwnerStudents();
    }
    return this.getStaffStudents();
  },

  async getPendingRequests(): Promise<CleanPendingRequest[]> {
    const user = getCurrentUser();
    if (user?.Role === "admin_owner") {
      return this.getOwnerStudentRequests();
    }
    return this.getStaffStudentRequests();
  },

  async createRequest(requestData: Partial<CleanPendingRequest>): Promise<CleanPendingRequest> {
    return this.createStaffStudentRequest(requestData);
  },

  async approveRequest(requestId: string): Promise<boolean> {
    await this.approveOwnerStudentRequest(requestId);
    return true;
  },

  async rejectRequest(requestId: string): Promise<boolean> {
    await this.rejectOwnerStudentRequest(requestId);
    return true;
  },

  async updateStudentKm(idOrPhone: string, completedKm: number): Promise<CleanStudentData> {
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/staff/students/${encodeURIComponent(idOrPhone)}/km`,
        {
          method: "PATCH",
          body: JSON.stringify({ CompletedKm: completedKm }),
        }
      );
      const result: ApiResponseEnvelope<any> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to update kilometers.");
      }
      return mapToCleanStudentData(result.Data);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async updateStudentDays(idOrPhone: string, completedDays: number): Promise<CleanStudentData> {
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/staff/students/${encodeURIComponent(idOrPhone)}/days`,
        {
          method: "PATCH",
          body: JSON.stringify({ CompletedDays: completedDays }),
        }
      );
      const result: ApiResponseEnvelope<any> = await response.json();
      if (!response.ok || !result.Success) {
        throw new Error(result.Message || "Failed to update days.");
      }
      return mapToCleanStudentData(result.Data);
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },

  async deleteStudent(idOrPhone: string): Promise<boolean> {
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/owner/students/${encodeURIComponent(idOrPhone)}`,
        {
          method: "DELETE",
        }
      );
      const result: ApiResponseEnvelope<null> = await response.json();
      return !!result.Success;
    } catch (err) {
      throw new Error(formatFriendlyError(err));
    }
  },
};