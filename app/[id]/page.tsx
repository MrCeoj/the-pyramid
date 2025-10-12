import PyramidDisplay from "@/components/pyramidPlayer/PyramidDisplay";
import { getPyramidData } from "@/actions/IndexActions";
import { notFound } from "next/navigation";
import { headers } from 'next/headers';

// every 10 minutes
export const revalidate = 600;

export default async function PyramidView({
  params,
}: {
  params: { id: string }
}) {
  // Dynamically rendered
  headers();

  if (typeof params.id !== "string") notFound();
  const id = Number(params.id)
  const pyramidData = await getPyramidData(id);

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