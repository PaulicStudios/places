import { NextRequest, NextResponse } from 'next/server';
import { findAllReviews } from '@/lib/db';

interface Review {
  review_id: number;
  product_code: string;
  description: string;
  stars: number;
  transactional_id: string;
  created_at?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Product code is required' },
        { status: 400 }
      );
    }

    const reviews = findAllReviews(code) as Review[];
    
    return NextResponse.json({
      reviews,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((acc, review) => acc + review.stars, 0) / reviews.length 
        : 0
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
