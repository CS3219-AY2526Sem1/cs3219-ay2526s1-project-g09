import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { UserService } from "../api/UserService";
import type { User } from "../api/UserService";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUserId = localStorage.getItem("userId");
    if (storedToken && storedUserId) {
      setToken(storedToken);
      UserService.getUser(storedUserId, storedToken)
        .then((res) => setUser(res.data))
        .catch(() => {
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("authToken", token);
    localStorage.setItem("userId", user.id);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
  };

  const refreshUser = async () => {
    if (!token || !user) return;
    const res = await UserService.getUser(user.id, token);
    setUser(res.data);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!token || !user) return;
    const res = await UserService.updateUser(user.id, updates, token);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, refreshUser, updateUser }}
    >
      {loading ? <div>Loading auth...</div> : children}
    </AuthContext.Provider>
  );
};
