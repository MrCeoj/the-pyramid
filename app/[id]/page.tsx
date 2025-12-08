import PyramidDisplay from "@/components/pyramidPlayer/PyramidDisplay";
import { getPyramidData } from "@/actions/IndexActions";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const revalidate = 600;

export default async function PyramidView({
  params,
}: {
  params: { id: string };
}) {
  headers();

  const { id } = params;

  // Validate param type
  if (typeof id !== "string") {
    notFound();
  }

  const pyramidId = Number(id);

  if (Number.isNaN(pyramidId)) {
    notFound();
  }

  const pyramidData = await getPyramidData(pyramidId);

  if (!pyramidData) {
    notFound();
  }

  return (
    <div className="h-screen overflow-scroll no-scrollbar pt-16">
      <PyramidDisplay data={pyramidData} />
    </div>
  );
}