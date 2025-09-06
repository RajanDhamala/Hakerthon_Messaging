import { UserProfile } from "@clerk/clerk-react";

export default function Profile() {
  return (
    <div className="flex justify-center py-10">
      {/* Clerk gives full profile UI (pfp, password, settings) */}
      <UserProfile />
    </div>
  );
}
