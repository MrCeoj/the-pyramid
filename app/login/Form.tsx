"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { login } from "./actions"; // Make sure the path is correct
import toast, { Toaster } from "react-hot-toast";
import { CircleX } from "lucide-react";

export default function LoginForm() {
  const isMobile = useIsMobile();

  // State to hold the error message from the server action
  const [error, setError] = useState<string | undefined>("");

  // useTransition hook to manage pending (loading) states
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    // Clear any previous errors
    setError(undefined);

    // startTransition wraps the server action call
    startTransition(async () => {
      // The `login` action requires a plain object, not FormData.
      // Let's create it from the form data.
      const values = Object.fromEntries(formData.entries());

      // We need to validate this object, but for simplicity we can just cast it.
      // A library like react-hook-form would handle this more gracefully.
      const result = await login({
        email: values.email as string,
        password: values.password as string,
      });

      // If the action returns an error, update the state
      if (result?.error) {
        setError(result.error);
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? "animate-custom-enter" : "animate-custom-leave"
            } gap-3 bg-red-100/80 shadow-lg items-center px-5 py-5 rounded-md pointer-events-auto ring-2 ring-red-600 flex max-w-3/4 lg:max-w-1/4 w-full h-auto`}
          >
            <CircleX size={32} color="#9f0712" />
            <div className="text-black font-bold h-auto flex flex-col justify-center max-w-3/4 w-full">
              {result.error}
            </div>
          </div>
        ));
      }
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:justify-center md:gap-16 h-screen max-h-screen mb-5">
      {/* --- Your Image divs (no changes needed) --- */}
      <Toaster position={isMobile ? "top-center" :"top-right"} />
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

      {/* --- Form Section --- */}
      <div className="bg-indor-black shadow-2xl rounded-2xl flex flex-col items-center p-8 w-3/4 lg:w-1/4 md:w-1/3 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-center text-gray-300 mb-6">
          ¡Hola de nuevo!
        </h1>
        {/* We use the action prop on the form element */}
        <form action={handleSubmit} className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Correo electrónico:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending} // Disable input when pending
              className="w-full px-4 py-2 border bg-white/90 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-vivid outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm text-white font-medium tex--indor-black"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending} // Disable input when pending
              className="w-full px-4 py-2 border bg-white/90 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-vivid outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={isPending} // Disable button when pending
              className="flex-1 bg-orange-vivid hover:bg-orange-dense text-white font-semibold py-2 rounded-xl shadow-md transition disabled:bg-orange-dense/50 disabled:cursor-not-allowed"
            >
              {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
