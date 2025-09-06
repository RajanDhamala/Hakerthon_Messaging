import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/clerk-react";
import axios from "axios";


export default function Home() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Send user data to backend after login/register
  useEffect(() => {
    if (!isSignedIn || !user) return;
    setLoading(true);
    setError("");
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
        setLoading(false);
        navigate("/chat");
      } catch (err) {
        setLoading(false);
        setError(err?.response?.data?.message || "Failed to sync user. Please try again.");
      }
    };
    syncUser();
  }, [isSignedIn, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 shadow-md bg-white">
        <h1 className="text-2xl font-bold text-blue-600">ChatWave 💬</h1>

        <SignedOut>
          <div className="flex gap-3">
            <SignInButton>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">
                Login
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium shadow hover:bg-gray-300 transition">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium shadow hover:bg-blue-200 transition"
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-1 px-4">
        <h2 className="text-5xl font-extrabold text-gray-800 mb-4 text-center">
          Realtime Chat for Family & Friends 🚀
        </h2>
        <p className="max-w-md text-lg text-gray-600 text-center mb-6">
          Fast. Private. Yours. Chat instantly with your circle, safely and securely.
        </p>

        {loading && (
          <div className="text-blue-600 font-medium mb-4">Syncing your account...</div>
        )}
        {error && (
          <div className="text-red-500 font-medium mb-4">{error}</div>
        )}
      </main>
    </div>
  );
}
