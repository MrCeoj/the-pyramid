"use client";
//import { login } from "./actions";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LoginForm() {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col md:flex-row items-center md:justify-center md:gap-16 h-screen max-h-screen mb-5">
      <div className="flex flex-col gap-8 mt-10 md:mt-0">
        {!isMobile && (
          <div className="relative lg:w-[400px] lg:h-[200px] md:w-[350px] md:h-[175px]">
            <Image
              src="/indor_norte_logo.svg"
              alt="Logo"
              layout="fill" // Ensures image fills the container
              objectFit="contain" // Maintains aspect ratio
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
      <div className="bg-indor-black shadow-2xl rounded-2xl flex flex-col items-center p-8 w-3/4 lg:w-1/ md:w-1/3 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-center text-gray-300 mb-6">
          ¡Hola de nuevo!
        </h1>
        <form className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Correo electrónico:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 border bg-white/90 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-vivid outline-none"
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
              className="w-full px-4 py-2 border bg-white/90 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-vivid outline-none"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              formAction={login}
              className="flex-1 bg-orange-vivid hover:bg-orange-dense text-white font-semibold py-2 rounded-xl shadow-md transition"
            >
              Inicar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
