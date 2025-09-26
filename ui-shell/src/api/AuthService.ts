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
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

export const AuthService = {
  verifyToken: (token: string) =>
    request<{ message: string; data: User }>("/auth/verify-token", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),
};
