import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import peerPrepIconWhite from "@assets/icon_white.svg";
import { cn } from "@/lib/utils";
import { useAuth } from "@/data/UserStore";
import { RemoteWrapper } from "../mfe/RemoteWrapper";

// Extract logout button to prevent re-mounting
const LogoutButtonWrapper: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { setUser, setIsLoggingOut } = useAuth();

  const loadLogoutButton = useMemo(
    () => () => import("userUiService/LogoutButton"),
    [],
  );

  const logoutRemoveProps = useMemo(
    () => ({
      onLogOutSuccess: () => {
        setIsLoggingOut(true);
        setUser(null);
        navigate("/", { state: { loggedOut: true } });
        setTimeout(() => setIsLoggingOut(false), 500);
      },
    }),
    [setIsLoggingOut, setUser, navigate],
  );

  return (
    <RemoteWrapper
      remote={loadLogoutButton}
      remoteName="User UI Service"
      remoteProps={logoutRemoveProps}
      suppressFallback
    />
  );
});

LogoutButtonWrapper.displayName = "LogoutButtonWrapper";

const NavHeaderComponent: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();

  // Function to apply active/inactive styles
  const getLinkClasses = (path: string) => {
    const baseClasses = "rounded-lg px-4 py-1 text-white transition";
    const activeClasses = "bg-teal-600 hover:bg-teal-700";
    const inactiveClasses = "bg-gray-700 hover:bg-gray-600";

    return cn(
      baseClasses,
      currentPath === path || currentPath.startsWith(`${path}/`)
        ? activeClasses
        : inactiveClasses,
    );
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4">
      {/* Logo */}
      <Link to="/">
        <div className="flex items-center space-x-2">
          <img src={peerPrepIconWhite} alt="PeerPrep Logo" className="h-8" />
        </div>
      </Link>

      {/* Menu */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-700 p-1 rounded-lg">
          <Link to="/matching" className={getLinkClasses("/matching")}>
            Collaborate
          </Link>
          <Link to="/history" className={getLinkClasses("/history")}>
            History
          </Link>
          <Link to="/settings" className={getLinkClasses("/settings")}>
            Settings
          </Link>
          {/* Only show for admins */}
          {user?.isAdmin && (
            <Link to="/questions" className={getLinkClasses("/questions")}>
              Questions
            </Link>
          )}
        </div>
        <div className="w-[88px] h-[40px] flex items-center justify-center">
          <LogoutButtonWrapper />
        </div>
      </div>
    </nav>
  );
};

const NavHeader = React.memo(NavHeaderComponent);
export default NavHeader;
