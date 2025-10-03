import { atom, useAtom } from "jotai";
import type { User } from "@peerprep/types";

export const userAtom = atom<User | null>(null);
export const loadingAtom = atom<boolean>(true);

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const [loading, setLoading] = useAtom(loadingAtom);

  return {
    user,
    loading,
    setUser,
    setLoading,
  };
}
