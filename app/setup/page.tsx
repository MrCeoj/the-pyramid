import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileSetupForm } from "./ProfileSetupForm";

export default async function ProfileSetupPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // If user already has a profile, redirect to home
  if (session.user.hasProfile) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <ProfileSetupForm user={session.user} />
    </div>
  );
}