import { NextRequest, NextResponse } from "next/server";
import { AverageStars } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }
  
  try {
    const averageStars = AverageStars(id);
    
    return NextResponse.json({
      product_code: id,
      average_stars: averageStars,
    });
  } catch (error) {
    console.error("Error calculating average stars:", error);
    return NextResponse.json(
      { error: "Failed to calculate average stars" },
      { status: 500 }
    );
  }
}
