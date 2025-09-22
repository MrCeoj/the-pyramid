import PyramidDisplay from "@/components/pyramidPlayer/PyramidDisplay";
import { getPyramidData } from "@/actions/IndexActions";
import { notFound } from "next/navigation";

export default async function PyramidView({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const param = await params;
  const pyramidData = await getPyramidData(param.id);
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
