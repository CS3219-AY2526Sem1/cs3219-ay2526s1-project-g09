import React from "react";
import { Link } from "react-router-dom";
import peerPrepIconWhite from "@assets/icon_white.svg";
import SessionHeader from "collabUiService/SessionHeader";

const NavHeader: React.FC = () => {
  return (
    <nav className="flex items-center justify-between px-8 py-4">
      {/* Logo */}
      <Link to="/">
        <div className="flex items-center space-x-2">
          <img src={peerPrepIconWhite} alt="PeerPrep Logo" className="h-8" />
        </div>
      </Link>

      {/* Menu */}
      <SessionHeader />
    </nav>
  );
};

export default NavHeader;
