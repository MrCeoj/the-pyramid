import type { Metadata } from "next";
import "./globals.css";
import HellBackground from "@/components/lightswind/hell-background";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Pirámide",
  description: "La Pirámide AM",
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
      <SessionProvider>
        <body className="h-screen w-screen bg-[#2c2c2c] overflow-hidden">
          <HellBackground
            color1="#f48a34"
            color2="#2c2c2c"
            backdropBlurAmount="lg"
            className="fixed h-full w-full z-0"
          />
          {/* Children content is wrapped in a container at a higher z-index */}
          <div className="relative z-10 w-full h-full">{children}</div>
        </body>
      </SessionProvider>
    </html>
  );
}
