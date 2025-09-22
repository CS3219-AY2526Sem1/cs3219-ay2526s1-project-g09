import React from "react";

interface BlueBgLayoutProps {
  children: React.ReactNode;
  navHeader: React.ReactNode; // The prop for the navbar
}

const BlueBgLayout: React.FC<BlueBgLayoutProps> = ({ children, navHeader }) => {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#0a2342] text-white">
      {/* This renders first, behind everything else */}
      <div className="w-full rotate-180 fixed bottom-0 left-0">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,224L60,197.3C120,171,240,117,360,128C480,139,600,213,720,234.7C840,256,960,224,1080,197.3C1200,171,1320,149,1380,138.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
          ></path>
        </svg>
      </div>

      {/* The dynamic navbar */}
      {navHeader}

      {/* Main Content with padding for the navbar */}
      <main className="flex flex-col flex-1 relative z-10">{children}</main>
    </div>
  );
};

export default BlueBgLayout;
