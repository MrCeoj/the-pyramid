"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { login, validateMailExistance } from "@/actions/LoginActions";
import toast, { Toaster } from "react-hot-toast";
import { ProfileSetupForm } from "./ProfileSetupForm";
import { PasswordSetupForm } from "./PasswordSetupForm";

type FormState = "email-only" | "password-only" | "setup";

// --- UPDATED USERDATA INTERFACE ---
// Replaced `hasProfile` with `needsProfileSetup` to match the server action's response.
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  needsProfileSetup: boolean;
}

export default function LoginForm() {
  const isMobile = useIsMobile();
  const [error, setError] = useState<string | undefined>("");
  const [formState, setFormState] = useState<FormState>("email-only");
  const [isPending, startTransition] = useTransition();
  const emailRef = useRef<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // This function remains the same
  const handleLogin = async (formData: FormData) => {
    setError(undefined);
    startTransition(async () => {
      const password = formData.get("password") as string;
      const result = await login({
        email: emailRef.current!,
        password,
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleEmailSubmit = async (formData: FormData) => {
    setError(undefined);
    const email = formData.get("email") as string;

    startTransition(async () => {
      const result = await validateMailExistance(email);

      if (result?.error) {
        setError(result.error);
      } else if (result?.user) {
        emailRef.current = result.user.email;
        setUser(result.user as UserData);

        if (result.user.needsProfileSetup || result.user.needAdminSetup) {
          // If the backend says setup is needed, switch to the setup state.
          setFormState("setup");
        } else {
          setFormState("password-only");
        }
      }
    });
  };

  // The JSX and rendering logic remains the same, as it's correctly driven by `formState`.
  return (
    <div className="flex flex-col md:flex-row items-center md:justify-center md:gap-16 h-screen max-h-screen mb-5">
      <Toaster position={isMobile ? "top-center" : "top-right"} />

      {formState === "setup" && user ? (
        user.role === "player" ? (
          <ProfileSetupForm user={user} />
        ) : user.role === "admin" ? (
          <PasswordSetupForm user={user} />
        ) : null
      ) : (
        <>
          <div className="flex flex-col gap-8 mt-10 md:mt-0">
            {!isMobile && (
              <div className="relative lg:w-[400px] lg:h-[200px] md:w-[350px] md:h-[175px]">
                <Image
                  src="/indor_norte_logo.svg"
                  priority
                  alt="Logo"
                  fill
                  objectFit="contain"
                />
              </div>
            )}
            <div className="relative lg:w-[400px] lg:h-[200px] md:w-[350px] md:h-[175px]">
              <Image
                src="/piramide_logo_title_naranja.svg"
                alt="logo"
                width={400}
                height={200}
                className="drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="bg-indor-black shadow-2xl rounded-2xl flex flex-col items-center p-8 w-3/4 lg:w-1/4 md:w-1/3 backdrop-blur-md">
            <h1 className="text-2xl font-bold text-center text-gray-300 mb-6">
              ¡Hola de nuevo!
            </h1>
            <form
              action={
                formState === "email-only" ? handleEmailSubmit : handleLogin
              }
              className="flex flex-col gap-4 w-full"
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-white"
                >
                  Correo electrónico:
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isPending || formState !== "email-only"}
                  className="w-full px-4 py-2 border bg-white/90 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-vivid outline-none disabled:opacity-50"
                  defaultValue={emailRef.current ?? ""}
                />
              </div>

              {formState === "password-only" && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm text-white font-medium"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={isPending}
                    className="w-full px-4 py-2 border bg-white/90 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-vivid outline-none disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-orange-vivid hover:bg-orange-dense text-white font-semibold py-2 rounded-xl shadow-md transition disabled:bg-orange-dense/50 disabled:cursor-not-allowed"
                >
                  {isPending
                    ? "Cargando..."
                    : formState === "email-only"
                    ? "Siguiente"
                    : "Iniciar sesión"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
