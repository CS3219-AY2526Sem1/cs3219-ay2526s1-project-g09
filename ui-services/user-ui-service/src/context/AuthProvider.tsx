import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { UserService } from "../api/UserService";
import type { User } from "../api/UserService";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    UserService.verifyToken()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    try {
      await UserService.logout();
    } catch {
      // ignore API errors
    }
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await UserService.verifyToken();
    setUser(res.data);
  };

  const updateUser = async (updates: Partial<User> & { password?: string }) => {
    if (!user) return;
    const res = await UserService.updateUser(user.id, updates);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, refreshUser, updateUser }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
