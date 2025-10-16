import { Metadata } from "next";
import MatchesPage from "./View";

export const metadata: Metadata = {
  title: "Mis Retas | Liga Pirámide AM",
  description: "La Pirámide AM",
  icons: {
    icon: "/piramide_logo_naranja.svg",
  },
};

export default function page() {
  return <MatchesPage />
}