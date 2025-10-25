import peerPrepIconBlack from "@assets/icon_black.svg";
import loginWave from "@assets/login_wave.svg";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Left Side with Wave Background */}
      <div className="hidden md:block w-1/3 relative">
        <img
          src={loginWave}
          alt="Wave Background"
          className="absolute h-screen w-auto object-cover"
        />
      </div>

      {/* Right Side - Content */}
      <div className="flex justify-center items-center bg-white px-6">
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
