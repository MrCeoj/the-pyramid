import type { Metadata } from "next";
import "./globals.css";
import HellBackground from "@/components/lightswind/hell-background";
import { SessionProvider } from "next-auth/react";
import { Jolly_Lodger } from "next/font/google"

const jolly = Jolly_Lodger({
  subsets: ['latin'],
  weight: ['400'],  // Jolly Lodger is a display font, usually just regular
  variable: '--font-jolly-lodger',
})

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
    <html lang="es" className={`${jolly.variable}`}>
      <SessionProvider>
        <body className="h-screen w-screen bg-[#2c2c2c] overflow-hidden">
          <HellBackground
            color1="#2c2c2c"
            color2="#f48a34"
            backdropBlurAmount="lg"
            className="fixed h-full w-full z-0"
          />
          <div className="relative z-10 w-full h-full">{children}</div>
        </body>
      </SessionProvider>
    </html>
  );
}
