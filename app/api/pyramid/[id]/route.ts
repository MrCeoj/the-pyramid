// app/api/pyramids/[id]/route.ts
import { NextRequest } from "next/server";
import { getPyramidData } from "@/app/actions"; // Adjust path as needed

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pyramidId = parseInt(params.id);
    
    if (isNaN(pyramidId)) {
      return Response.json(
        { error: "Invalid pyramid ID" },
        { status: 400 }
      );
    }

    const pyramidData = await getPyramidData(pyramidId);
    
    if (!pyramidData) {
      return Response.json(
        { error: "Pyramid not found" },
        { status: 404 }
      );
    }

    return Response.json(pyramidData);
  } catch (error) {
    console.error("Error fetching pyramid data:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

