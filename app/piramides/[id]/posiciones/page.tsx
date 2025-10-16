import { getPyramidData } from "@/actions/IndexActions";
import PyramidDisplay from "./PyramidPositionsEdit";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posiciones | Liga Pirámide AM",
  description: "La Pirámide AM",
  icons: {
    icon: "/piramide_logo_naranja.svg",
  },
};

export default async function PositionsPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {

  const sesh = await auth()
  if (!sesh || sesh.user.role !== "admin"){
    redirect("/")
  }

  const param = await params;
  const pyramidId = param.id;

  if (pyramidId === undefined || pyramidId === null) {
    return notFound();
  }

  const pyramidData = await getPyramidData(pyramidId);

  if (!pyramidData) {
    return notFound();
  }

  return (
    <div className="h-screen overflow-auto no-scrollbar pt-16">
      <UserDropdownMenu />
      <PyramidDisplay data={pyramidData} />
    </div>
  );
}
