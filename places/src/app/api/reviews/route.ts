import { NextRequest, NextResponse } from "next/server";
import { findPagenatedReviews, getTotalReviewCount } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Get query parameters
  const id = searchParams.get('id');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  
  // Validate parameters
  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }
  
  const fromReview = start ? parseInt(start) : 0;
  const toReview = end ? parseInt(end) : 10;
  
  try {
    const reviews = findPagenatedReviews(id, fromReview, toReview);
    const totalCount = await getTotalReviewCount(id);
    
    return NextResponse.json(
      { reviews, totalCount },
      {status: 200}
    );
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" }, 
      { status: 500 }
    );
  }
}
