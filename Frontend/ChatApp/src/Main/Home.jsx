import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 shadow-md bg-white">
        <h1 className="text-2xl font-bold text-blue-600">ChatWave 💬</h1>

        <SignedOut>
          <div className="flex gap-3">
            {/* Sign In → goes straight to chat */}
            <SignInButton afterSignInUrl="/chat">
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">
                Login
              </button>
            </SignInButton>

            {/* Sign Up → redirect to /post-signup */}
            <SignUpButton afterSignUpUrl={`${window.location.origin}/post-signup`}>
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
      </main>
    </div>
  );
}
