import React from "react";
import { Routes, Route } from "react-router-dom";

import LandingPage from "@pages/LandingPage";

import LoginPage from "@pages/auth/LoginPage";
import ForgotPasswordPage from "@pages/auth/ForgotPasswordPage";
import SignUpPage from "@pages/auth/SignUpPage";
import OtpPage from "@pages/auth/OtpPage";
import SetDisplayNamePage from "@pages/auth/SetDisplayNamePage";

import UserProfilePage from "@pages/auth/UserProfilePage";
import MatchingPage from "@/pages/matching/MatchingPage";

import SessionPage from "@pages/collab/SessionPage";

import HistoryPage from "@pages/history/HistoryPage";
import QuestionAttemptsPage from "@pages/history/QuestionAttemptsPage";
import AttemptPage from "@pages/history/AttemptPage";

import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public access */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      {/* Requires tempAuthToken */}
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/setDisplayName" element={<SetDisplayNamePage />} />
      {/* Requires authToken */}
      <Route element={<ProtectedRoute />}>
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/collab" element={<SessionPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/questionAttempts" element={<QuestionAttemptsPage />} />
        <Route path="/attempt" element={<AttemptPage />} />
        <Route path="/settings" element={<UserProfilePage />} />
      </Route>
    </Routes>
  );
}
