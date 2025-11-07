import React from "react";
import { useOutletContext } from "react-router-dom";
import DefaultNavHeader from "@/components/common/NavHeader";

interface OutletContext {
  navHeaderComponent?: React.ComponentType;
}

interface BlueBgLayoutProps {
  children: React.ReactNode;
  navHeaderComponent?: React.ComponentType;
}

const BlueBgLayout: React.FC<BlueBgLayoutProps> = ({
  children,
  navHeaderComponent: overrideHeader,
}) => {
  const outletContext = useOutletContext<OutletContext | undefined>();

  const Header =
    overrideHeader ?? outletContext?.navHeaderComponent ?? DefaultNavHeader;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#0a2342] text-white">
      {/* Background SVG */}
      <div className="w-full rotate-180 fixed bottom-0 left-0 pointer-events-none select-none">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,224L60,197.3C120,171,240,117,360,128C480,139,600,213,720,234.7C840,256,960,224,1080,197.3C1200,171,1320,149,1380,138.7L1440,128V0H0Z"
          />
        </svg>
      </div>

      {/* Stable Header */}
      <Header />

      <main className="flex flex-col flex-1 relative z-10">{children}</main>
    </div>
  );
};

export default BlueBgLayout;
