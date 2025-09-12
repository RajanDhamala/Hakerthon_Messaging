import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function PostSignUp() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Syncing user to backend...");

  useEffect(() => {
    if (!user) return;

    const registerUser = async () => {
      try {
        await axios.post(`${import.meta.env.VITE_BASE_URL}user/register`, {
          clerkId: user.id,
          displayName: user.fullName,
          avatarUrl: user.profileImageUrl,
          birthDate: user.birthDate,
          gender: user.gender,
          email: user.emailAddresses[0]?.emailAddress,
        });
        setStatus("User synced! Redirecting...");
      } catch (err) {
        console.error("Failed to register user:", err);
        setStatus("Failed to sync user. Redirecting anyway...");
      } finally {
        setTimeout(() => navigate("/chat"), 1000); // wait 1s before redirect
      }
    };

    registerUser();
  }, [user, navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-lg font-medium text-blue-600">
      {status}
    </div>
  );
}
