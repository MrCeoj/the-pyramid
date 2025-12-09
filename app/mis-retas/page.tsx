import { Metadata } from "next";
import MatchesPage from "./View";
import { auth } from "@/lib/auth";
import UnauthorizedView from "@/app/views/UnauthorizedView";
import { getPlayerPyramids } from "@/actions/IndexActions";
import { PyramidHydrator } from "@/components/wrappers/PyramidHydrator";

export const metadata: Metadata = {
  title: "Mis Retas | Liga Pirámide AM",
  description: "La Pirámide AM",
  icons: {
    icon: "/piramide_logo_naranja.svg",
  },
};

export default async function page() {
  const session = await auth();

  if (!session?.user?.id) {
    return <UnauthorizedView type="no-session" />;
  }

  const playerPyramids = await getPlayerPyramids(session.user.id);

  return (
    <>
      <PyramidHydrator
        pyramids={playerPyramids!}
        defaultPyramidId={playerPyramids![0].id}
      />
      <MatchesPage />
    </>
  );
}
