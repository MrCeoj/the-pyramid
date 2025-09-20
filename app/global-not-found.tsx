import "./globals.css";
import type { Metadata } from "next";
import HellBackground from "@/components/lightswind/hell-background";
import Image from "next/image";
export const metadata: Metadata = {
  title: "La pirámide | Página no encontrada",
  description: "La página que buscas no existe.",
};

export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body>
        <HellBackground
          color1="#f48a34"
          color2="#2c2c2c"
          backdropBlurAmount="lg"
          className="fixed h-full w-full -z-10"
        />
        <div className="w-screen h-screen flex flex-col md:flex-row justify-center items-center">
          <div className="w-[300px] h-[140px] md:max-w-1/2 relative">
            <Image
              src="/piramide_logo_title.svg"
              alt="Logo"
              fill
              objectFit="cover"
              className="drop-shadow-slate-700 drop-shadow-[0_0_0.3rem]"
            />
          </div>
          <div className="border-t-4 md:border-t-0 md:border-l-4 md:pl-6 md:ml-6 border-white/50 py-5 flex flex-col justify-center items-center text-white text-shadow-black text-shadow-xl">
            <h1 className="text-3xl font-bold">Por aquí no hay nada...</h1>
            <p className="text-xl mt-2 font-semibold">La página que buscas no existe.</p>
          </div>
        </div>
      </body>
    </html>
  );
}
