import PyramidSelector from "@/components/ui/PyramidSelector";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import ZustandSessionInitializer from "@/components/wrappers/ZustandSessionInitializer";
import { PyramidHydrator } from "@/components/wrappers/PyramidHydrator";

export default function AdminView({
  allPyramids,
  defaultPyramidId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allPyramids: any[];
  defaultPyramidId: number;
}) {
  if (allPyramids.length === 0) {
    return (
      <main className="h-screen flex flex-col">
        <ZustandSessionInitializer />

        <div className="fixed top-4 right-4 z-50">
          <UserDropdownMenu />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">
          <h1 className="text-2xl font-bold mb-4">No hay pirámides disponibles.</h1>
          <p>No existen pirámides activas en este momento.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col justify-start">
      <ZustandSessionInitializer />

      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        <PyramidHydrator pyramids={allPyramids} defaultPyramidId={defaultPyramidId} />
        <UserDropdownMenu />
      </div>

      <div className="flex flex-col justify-center overflow-y-auto">
        <PyramidSelector />
      </div>
    </main>
  );
}