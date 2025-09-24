const BASE_URL = "http://localhost:5277/api/user-service";

export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
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

  login: (email: string, password: string) =>
    request<{ message: string; accessToken?: string; data: User }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    ),

  verifyToken: (token: string) =>
    request<{ message: string; data: User }>("/auth/verify-token", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  sendOtp: (email: string) =>
    request<{ message: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ message: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  getUser: (userId: string, token: string) =>
    request<{ message: string; data: User }>(`/users/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateUser: (userId: string, data: Partial<User>, token: string) =>
    request<{ message: string; data: User }>(`/users/${userId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: string, token: string) =>
    request<{ message: string }>(`/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
};
