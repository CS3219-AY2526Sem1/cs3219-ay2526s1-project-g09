import { Routes, Route, Link } from "react-router-dom";
import LoginPage from "@pages/auth/LoginPage";
import peerPrepIconWhite from "@assets/icon_white.svg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

/* Hero Section */
const HeroSection: React.FC = () => (
  <section className="flex flex-col justify-center items-center h-[90vh] px-6">
    <div>
      <img src={peerPrepIconWhite} alt="PeerPrep Logo" className="h-30" />
      <p className="mt-4 text-lg text-blue-200 text-center">
        Technical interviews can feel overwhelming, <br />
        but you don’t have to do it alone.
      </p>
    </div>
    <div className="flex justify-end items-center p-6">
      <Link to="/login">
        <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
          <p className="text-white font-semibold rounded-lg text-xl">
            Get Started
          </p>
        </Button>
      </Link>
    </div>
  </section>
);

interface WaveDividerProps {
  flip?: boolean;
  color?: string; // main wave color
  backgroundColor?: string; // translucent wave behind
}

const WaveDivider: React.FC<WaveDividerProps> = ({
  flip = false,
  color = "#ffffff",
  backgroundColor = "rgba(255, 255, 255, 0.4)", // translucent white
}) => (
  <div className="relative h-24 overflow-hidden">
    <svg
      className={`absolute top-0 left-0 w-full h-full ${
        flip ? "rotate-180" : ""
      }`}
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
    >
      {/* Background wave (translucent) */}
      <path
        transform="translate(200, 0)"
        fill={backgroundColor}
        d="M0,64L48,74.7C96,85,192,107,288,101.3C384,96,480,64,576,64C672,64,768,96,864,96C960,96,1056,64,1152,53.3C1248,43,1344,53,1392,58.7L1440,64V0H0Z"
      />
      {/* Foreground wave (solid) */}
      <path
        fill={color}
        d="M0,64L48,74.7C96,85,192,107,288,101.3C384,96,480,64,576,64C672,64,768,96,864,96C960,96,1056,64,1152,53.3C1248,43,1344,53,1392,58.7L1440,64V0H0Z"
      />
    </svg>
  </div>
);

/* How To Use Section */
const HowToUseSection: React.FC = () => (
  <section className="bg-white text-gray-800 relative z-10 px-6 h-[60vh] flex flex-col justify-center">
    <h2 className="text-3xl font-bold text-center mb-10">How To Use</h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
      {[
        {
          step: 1,
          title: "Select Your Practice",
          text: "Choose the difficulty level, desired time limit, and topic you want to focus on.",
        },
        {
          step: 2,
          title: "Get Matched",
          text: "PeerPrep connects you with another student who picked the same options.",
        },
        {
          step: 3,
          title: "Start Solving Together",
          text: "Work on a real interview-style question in a shared space—just like the real thing!",
        },
      ].map(({ step, title, text }) => (
        <div key={step} className="flex flex-col items-center text-center">
          <div className="bg-blue-100 text-blue-700 w-10 h-10 flex items-center justify-center rounded-full font-bold mb-4">
            {step}
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-gray-600 mt-2">{text}</p>
        </div>
      ))}
    </div>
  </section>
);

/* FAQ Section */
const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: "Is PeerPrep free to use?",
      answer:
        "Yes! PeerPrep is completely free for students to use. Just sign up and start practicing.",
    },
    {
      question: "How does matching work?",
      answer:
        "We pair you with another student who has selected the same difficulty level and topic so you can collaborate in real time.",
    },
    {
      question: "Can I practice alone?",
      answer: "No, you can't practice alone.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="text-gray-800 px-6 py-20 h-[70vh] flex flex-col justify-center items-center">
      <h1 className="text-white text-3xl font-bold text-center mb-10">FAQ</h1>
      <div className="max-w-3xl mx-auto space-y-4 w-full">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow p-4 cursor-pointer"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <h3 className="font-semibold text-lg flex justify-between items-center">
              {faq.question}
              <span>{openIndex === index ? "−" : "+"}</span>
            </h3>
            {openIndex === index && (
              <p className="mt-2 text-gray-600">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

/* Footer Component */
const Footer: React.FC = () => (
  <footer className="bg-gray-800 text-center text-sm text-gray-400 py-6">
    <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
      <div className="text-sm">
        &copy; {new Date().getFullYear()} PeerPrep. All rights reserved.
      </div>
      <div className="text-sm">
        <p>Developed by:</p>
      </div>
      <div className="flex flex-wrap justify-center space-x-4">
        <span>WOO ZONG HUA</span>
        <span>CENSON LEE LEMUEL JOHN ALEJO</span>
        <span>SONG JIA HUI</span>
        <span>SHARON SOH XUAN HUI</span>
        <span>YAP ZHAO YI</span>
      </div>
    </div>
  </footer>
);

/* Landing Page Composition */
const LandingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (location.state?.loggedOut) {
      setShowLogoutDialog(true);
      // clear state so dialog doesn’t reappear after refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col bg-[#0a2342] text-white">
      <HeroSection />
      <WaveDivider flip />
      <HowToUseSection />
      <WaveDivider />
      <FAQSection />
      <Footer />
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logged Out</DialogTitle>
            <DialogDescription>
              You have successfully logged out of your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setShowLogoutDialog(false)}
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* Main App */
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};

export default App;
