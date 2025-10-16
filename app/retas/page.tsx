import { Metadata } from "next";
import AdminMatchesPage from "./View";

export const metadata: Metadata = {
  title: "Retas | Liga Pirámide AM",
  description: "La Pirámide AM",
  icons: {
    icon: "/piramide_logo_naranja.svg",
  },
};

export default function page() {
  return <AdminMatchesPage />
}