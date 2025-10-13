import PyramidDisplay from "@/components/pyramidPlayer/PyramidDisplay";
import { getPyramidData } from "@/actions/IndexActions";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

// every 10 minutes
export const revalidate = 600;

export default async function PyramidView({
  params,
}: {
  params: { id: string };
}) {
  // Dynamically rendered
  headers();
  const { id } = await params;
  if (typeof id !== "string") notFound();
  const pyramidId = Number(id);
  const pyramidData = await getPyramidData(pyramidId);

  if (pyramidData) {
    return (
      <div className="h-screen overflow-scroll no-scrollbar pt-16">
        <PyramidDisplay data={pyramidData} />
      </div>
    );
  } else {
    notFound();
  }
}
