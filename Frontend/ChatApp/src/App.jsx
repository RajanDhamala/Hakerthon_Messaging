import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Suspense, useEffect, useState } from "react";
import { LazyChat, LazyProfile, LazyHome } from "./LazyLoading/LazyLoading";
import axios from "axios";
import useSocket from "./Zustand/useSocket";
import Search from "./Search";
import { Toaster } from "react-hot-toast";
import  MessageRequests from "./MessageRequests"
import GenerateKeys from "./GenerateKeys";
import useKeyStore from "./Zustand/keyStore";
import TestChat from "./TestChat";
import CreateGroup from "./CreateGroup";

function AppRoutes() {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const {publicKey } = useKeyStore();

  const { connect } = useSocket();

  useEffect(() => {
    if (!isSignedIn || !user) return setChecking(false);
    connect('localhost:8000', user.id,user.fullName,publicKey);
    const checkAndRegister = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}user/exists/${user.id}`);
        if (res.data.statusCode === 404) {
          await axios.post(`${import.meta.env.VITE_BASE_URL}user/register`, {
            clerkId: user.id,
            displayName: user.fullName,
            avatarUrl: user.profileImageUrl,
            birthDate: user.birthDate,
            gender: user.gender,
            email: user.emailAddresses[0]?.emailAddress,
          });
        }
      } catch (err) {
        console.error("Error checking or registering user:", err);
      } finally {
        setChecking(false);
        // navigate("/chat"); // always redirect after check/register
      }
    };

    checkAndRegister();
  }, [isSignedIn, user, navigate]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center text-blue-600 font-medium">
        Syncing user...
      </div>
    );
  }
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
      <Route path="/" element={<LazyHome />} />
      <Route path="/chat" element={<SignedIn><LazyChat /></SignedIn>} />
      <Route path="/chat" element={<SignedOut><Navigate to="/" /></SignedOut>} />
      <Route path="/profile" element={<SignedIn><LazyProfile /></SignedIn>} />
      <Route path="/profile" element={<SignedOut><Navigate to="/" /></SignedOut>} />
      <Route path="/search" element={<Search />} />
      <Route path="/msg-requests" element={<MessageRequests />} />
      <Route path="*" element={<div className="flex h-screen items-center justify-center">404 - Page Not Found</div>} />
      <Route path="/keys" element={<GenerateKeys />} />
       <Route path="/test" element={<TestChat />} />
        <Route path="/create-group" element={<CreateGroup />} />
    </Routes>
    </>
    
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <AppRoutes />
      </Suspense>
    </Router>
  );
}
