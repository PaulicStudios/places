import { NextRequest, NextResponse } from 'next/server';
import { findAllReviews, saveReview } from '@/lib/db';
import { auth } from '@/auth';

interface Review {
  review_id: number;
  product_code: string;
  name: string;
  description: string;
  stars: number;
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { code } = await params;
    const body = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Product code is required' },
        { status: 400 }
      );
    }

    const { description, stars } = body;
    
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Review description is required' },
        { status: 400 }
      );
    }

    if (!stars || typeof stars !== 'number' || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const reviewData = {
      product_code: code,
      name: session.user.username || 'Anonymous',
      description: description.trim(),
      stars: Math.round(stars)
    };

    const result = saveReview(reviewData);
    
    return NextResponse.json({
      success: true,
      review: {
        ...reviewData,
        review_id: result.lastInsertRowid
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
