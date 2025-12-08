import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import ZustandSessionInitializer from "@/components/wrappers/ZustandSessionInitializer";
import PyramidDisplay from "@/components/pyramidPlayer/PyramidDisplay";

export default function PlayerView({
  pyramid,
  userTeamId,
}: {
  pyramid: any;
  userTeamId: number | null;
}) {
  if (!pyramid) {
    return (
      <main className="h-screen flex flex-col justify-center items-center bg-gradient-to-b from-black/20 to-indor-black/80 text-white px-4">
        <ZustandSessionInitializer />
        <UserDropdownMenu />
        <div className="bg-indor-black/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md text-center border border-white/10">
          <h1 className="text-3xl font-extrabold mb-3">Sin participación</h1>
          <p className="text-white/80 mb-3">Aún no te asignan a una pirámide.</p>
          <p className="text-white/60 text-sm">
            Contacta a un organizador si crees que esto es un error.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col justify-center">
      <ZustandSessionInitializer />
      <div className="flex flex-col justify-start py-16 overflow-y-scroll no-scrollbar">
        <PyramidDisplay data={pyramid} userTeamId={userTeamId} />
      </div>
      <UserDropdownMenu />
    </main>
  );
}