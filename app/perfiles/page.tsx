import { Metadata } from "next";
import UsersPage from "./View";

export const metadata: Metadata = {
  title: "Perfiles | Liga Pirámide AM",
  description: "La Pirámide AM",
  icons: {
    icon: "/piramide_logo_naranja.svg",
  },
};

export default function page() {
  return <UsersPage />
}