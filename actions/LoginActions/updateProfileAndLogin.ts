"use server";
import { AuthError } from "@auth/core/errors";
import { CreateProfileData } from "./types";
import { updateProfile } from "./updateProfile";

// New combined function for profile setup with login
export async function updateProfileAndLogin(
  data: CreateProfileData & { email: string }
) {
  try {
    // First update the profile
    const profileResult = await updateProfile(data);

    if (!profileResult.success) {
      return profileResult;
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateProfileAndLogin:", error);

    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Error de autenticación después de crear el perfil.",
      };
    }

    return {
      success: false,
      error: "Error inesperado al actualizar el perfil.",
    };
  }
}