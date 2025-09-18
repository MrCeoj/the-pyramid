"use server";
import { db } from "@/lib/drizzle";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/lib/auth"; 
import { redirect } from "next/navigation";

// The data from the form won't need the userId anymore, 
// as we'll get it securely from the session.
interface CreateProfileData {
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export async function createProfile(data: CreateProfileData) {
  // 3. Get the user's session securely on the server
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "No autenticado. Inicia sesión de nuevo." };
  }
  const userId = session.user.id;

  try {
    // Check if profile already exists for this user
    const existingProfile = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, userId)) // Use the secure userId from session
      .limit(1);

    if (existingProfile.length > 0) {
      return { success: false, error: "El perfil ya existe" };
    }
    // Create the profile
    await db.insert(profile).values({
      userId: userId, // Use the secure userId from session
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname,
      avatarUrl: data.avatarUrl,
    });
    
    // 4. THE CORE FIX: Update the session token with the new profile status
    await unstable_update({
      user: {
        hasProfile: true,
      }
    });

    revalidatePath("/");

    // 5. Instead of returning, we redirect the user to the main page
    // The client-side form logic can handle the redirect itself, but this is more robust.
  } catch (error) {
    console.error("Error creating profile:", error);

    if (error instanceof Error && error.message.includes("nickname")) {
      return { success: false, error: "Este apodo ya está en uso" };
    }
    
    return { success: false, error: "Error al crear el perfil" };
  }

  // Redirect on success, outside the try/catch block
  redirect('/'); 
}