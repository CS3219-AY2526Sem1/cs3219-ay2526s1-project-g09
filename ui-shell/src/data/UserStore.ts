import { atom, useAtom } from "jotai";
import type { User } from "@/types/User";

export const userAtom = atom<User | null>(null);
export const loadingAtom = atom<boolean>(true);
const isLoggingOutAtom = atom<boolean>(false);

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [isLoggingOut, setIsLoggingOut] = useAtom(isLoggingOutAtom);

  return { user, setUser, loading, setLoading, isLoggingOut, setIsLoggingOut };
}
