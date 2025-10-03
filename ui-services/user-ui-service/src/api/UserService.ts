import type { User } from "../types/User";

const BASE_URL = "http://localhost:5277/api/user-service";

let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch("http://localhost:5277/api/csrf-token", {
    credentials: "include",
  });
  const data = await res.json();
  csrfToken = data.csrfToken;
  if (!csrfToken) {
    throw new Error("Failed to fetch CSRF token");
  }

  return csrfToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = await getCsrfToken();
    headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

export const UserService = {
  register: (username: string, email: string, password: string) =>
    request<{ message: string; data: User }>("/users", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email: string, password: string, rememberMe: boolean) =>
    request<{ message: string; data: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    }),

  logout: async () => {
    const res = await request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
    csrfToken = null;
    return res;
  },

  verifyToken: () =>
    request<{ message: string; data: User }>("/auth/verify-token", {
      method: "GET",
    }),

  sendOtp: (email: string) =>
    request<{ message: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ message: string; data: User }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  getUser: (userId: string) =>
    request<{ message: string; data: User }>(`/users/${userId}`, {
      method: "GET",
    }),

  updateUser: (userId: string, data: Partial<User> & { password?: string }) =>
    request<{ message: string; data: User }>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: string) =>
    request<{ message: string }>(`/users/${userId}`, {
      method: "DELETE",
    }),
};
