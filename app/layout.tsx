import type { Metadata } from "next";
import "./globals.css";
//import { createClient } from "@/lib/supabase/server";
import HellBackground from "@/components/lightswind/hell-background";
//import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Pirámide",
  description: "La Mañanera",
  icons: {
    icon: "/piramide_logo_naranja.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/*<body className="h-screen [text-shadow:2px_2px_4px_rgba(0,0,0,0.3)] bg-[radial-gradient(ellipse_70%_50%_at_50%_20%,var(--orange-pale)_0%,transparent_50%),radial-gradient(ellipse_60%_70%_at_70%_40%,var(--orange-vivid)_0%,transparent_50%),radial-gradient(ellipse_80%_70%_at_50%_90%,var(--orange-dense)_0%,transparent_60%),linear-gradient(120deg,var(--indor-orange)_0%,var(--orange-vivid)_40%,var(--orange-dense)_100%)]">*/}
      <body className="h-screen w-screen bg-[#2c2c2c]">
        <HellBackground
        color1="#f48a34"
        color2="#2c2c2c"
        backdropBlurAmount="lg"
        className="fixed h-full w-full"
      />
        {children}
      </body>
    </html>
  );
}
