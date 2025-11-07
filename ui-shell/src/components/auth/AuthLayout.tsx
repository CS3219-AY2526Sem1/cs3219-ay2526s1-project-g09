import peerPrepIconBlack from "@assets/icon_black.svg";
import loginWave from "@assets/login_wave.svg";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative flex min-h-screen">
      {/* Wave Background - Positioned absolutely, no space taken */}
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1/3 pointer-events-none">
        <img
          src={loginWave}
          alt="Wave Background"
          className="h-full w-auto object-cover"
        />
      </div>
      {/* Content - Takes full width */}
      <div className="flex-1 flex justify-center items-center bg-white px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <a href="/">
              <img
                src={peerPrepIconBlack}
                alt="PeerPrep Logo"
                className="h-20"
              />
            </a>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
