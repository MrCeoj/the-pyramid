// app/api/pyramids/route.ts (Optional: for getting all pyramids)
import { getAllPyramids } from "@/app/actions";

export async function GET() {
  try {
    const pyramids = await getAllPyramids();
    return Response.json(pyramids);
  } catch (error) {
    console.error("Error fetching pyramids:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}