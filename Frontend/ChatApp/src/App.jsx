import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Suspense, useEffect } from "react";
import { LazyChat, LazyProfile, LazyHome } from "./LazyLoading/LazyLoading"; // adjust path
import axios from "axios";

function App() {
  const { user, isSignedIn } = useUser();

  // Sync logged-in user to backend on app start
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const syncUser = async () => {
      try {
        await axios.post(`${import.meta.env.VITE_BASE_URL}user/register`, {
          clerkId: user.id,
          displayName: user.fullName,
          avatarUrl: user.profileImageUrl,
          birthDate: user.birthDate,
          gender: user.gender,
          email: user.emailAddresses[0]?.emailAddress,
        });
      } catch (err) {
        console.error("Failed to sync user:", err);
      }
    };

    syncUser();
  }, [isSignedIn, user]);

  return (
    <Router>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LazyHome />} />

          {/* Protected Chat */}
          <Route
            path="/chat"
            element={
              <SignedIn>
                <LazyChat />
              </SignedIn>
            }
          />
          <Route
            path="/chat"
            element={
              <SignedOut>
                <Navigate to="/" />
              </SignedOut>
            }
          />

          {/* Protected Profile */}
          <Route
            path="/profile"
            element={
              <SignedIn>
                <LazyProfile />
              </SignedIn>
            }
          />
          <Route
            path="/profile"
            element={
              <SignedOut>
                <Navigate to="/" />
              </SignedOut>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
