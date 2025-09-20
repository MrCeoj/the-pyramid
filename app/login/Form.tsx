"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { login, validateMailExistance } from "./actions";
import toast, { Toaster } from "react-hot-toast";
import { CircleX } from "lucide-react";
import { ProfileSetupForm } from "./ProfileSetupForm"; // Assuming this is the correct path
import { PasswordSetupForm } from "./PasswordSetupForm";

// Now includes the setup state
type FormState = "email-only" | "password-only" | "setup";

// User type to hold the data returned from the server
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  password: string | null;
  role: string;
  hasProfile: boolean;
}

export default function LoginForm() {
  const isMobile = useIsMobile();
  const [error, setError] = useState<string | undefined>("");
  const [formState, setFormState] = useState<FormState>("email-only");
  const [isPending, startTransition] = useTransition();
  const emailRef = useRef<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    console.log(user);
  }, [user]);

  const handleEmailSubmit = async (formData: FormData) => {
    setError(undefined);
    const email = formData.get("email") as string;

    startTransition(async () => {
      const result = await validateMailExistance(email);

      if (result?.error) {
        setError(result.error);
        showToast(result.error);
      } else if (result?.user) {
        // Check for the returned user object
        emailRef.current = result.user.email;
        setUser(result.user);

        if (!result.user.password) {
          setFormState("setup");
        } else if (result.user.hasProfile || result.user.role === "admin")
          setFormState("password-only");
      }
    });
  };

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
        showToast(result.error);
      }
    });
  };

  const showToast = (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-custom-enter" : "animate-custom-leave"
        } gap-3 bg-red-100/80 shadow-lg items-center px-5 py-5 rounded-md pointer-events-auto ring-2 ring-red-600 flex max-w-3/4 lg:max-w-1/4 w-full h-auto`}
      >
        <CircleX size={32} color="#9f0712" />
        <div className="text-black font-bold h-auto flex flex-col justify-center max-w-3/4 w-full">
          <p>{message}</p>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:justify-center md:gap-16 h-screen max-h-screen mb-5">
      <Toaster position={isMobile ? "top-center" : "top-right"} />

      {/* --- Conditional Form Rendering --- */}
      {formState === "setup" && user ? (
        user.role === "player" ? (
          <ProfileSetupForm user={user} />
        ) : user.role === "admin" ? (
          <PasswordSetupForm user={user} /> // only password
        ) : null
      ) : (
        <>
          <div className="flex flex-col gap-8 mt-10 md:mt-0">
            {!isMobile && (
              <div className="relative lg:w-[400px] lg:h-[200px] md:w-[350px] md:h-[175px]">
                <Image
                  src="/indor_norte_logo.svg"
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
