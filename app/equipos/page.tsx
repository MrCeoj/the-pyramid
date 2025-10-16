import { Metadata } from "next";
import TeamManagement from "./View";

export const metadata: Metadata = {
  title: "Equipos | Liga Pirámide AM",
  description: "La Pirámide AM",
  icons: {
    icon: "/piramide_logo_naranja.svg",
  },
};

export default function page() {
  return <TeamManagement />
}