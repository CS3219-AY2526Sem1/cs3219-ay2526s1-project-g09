import { Routes, Route } from "react-router-dom";

import LandingPage from "@pages/LandingPage";

import LoginPage from "@pages/auth/LoginPage";
import ForgotPasswordPage from "@pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@pages/auth/ResetPasswordPage";
import SignUpPage from "@pages/auth/SignUpPage";
import OtpPage from "@pages/auth/OtpPage";

import UserProfilePage from "@pages/auth/UserProfilePage";
import MatchingPage from "@/pages/matching/MatchingPage";

import SessionPage from "@pages/collab/SessionPage";

import HistoryPage from "@pages/history/HistoryPage";
import QuestionAttemptsPage from "@pages/history/QuestionAttemptsPage";
import AttemptPage from "@pages/history/AttemptPage";

import ProtectedRoute from "@components/auth/ProtectedRoute";
import UnverifiedRoute from "@components/auth/UnverifiedRoute";
import PublicRoute from "@components/auth/PublicRoute";

import { useEffect } from "react";
import { useAuth } from "@/data/UserStore";
import { UserService } from "./api/UserService";
import AdminRoute from "./components/auth/AdminRoute";
import QuestionPage from "./pages/question/QuestionsList";
import QuestionDetailsPage from "./pages/question/QuestionDetails";
import QuestionEditPageShell from "./pages/question/QuestionEdit";
import QuestionAddPageShell from "./pages/question/QuestionAdd";

export default function App() {
  const { setUser, setLoading } = useAuth();

  useEffect(() => {
    setLoading(true);
    UserService.verifyToken()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  return (
    <Routes>
      {/* Public access */}
      <Route path="/" element={<LandingPage />} />
      {/* Only non-logged in users*/}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/resetPassword" element={<ResetPasswordPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>
      {/* Only unverified users */}
      <Route element={<UnverifiedRoute />}>
        <Route path="/otp" element={<OtpPage />} />
      </Route>
      {/* Only verified users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/collab" element={<SessionPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/questionAttempts" element={<QuestionAttemptsPage />} />
        <Route path="/attempt" element={<AttemptPage />} />
        <Route path="/settings" element={<UserProfilePage />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/questions" element={<QuestionPage />} />
        <Route path="/questions/add" element={<QuestionAddPageShell />} />
        <Route path="/questions/:id" element={<QuestionDetailsPage />} />
        <Route path="/questions/:id/edit" element={<QuestionEditPageShell />} />
      </Route>
    </Routes>
  );
}
