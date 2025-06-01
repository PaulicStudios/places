'use server';

import { NextRequest, NextResponse } from 'next/server';
import { 
  getMostReviewedProducts, 
  getTrendingProducts, 
  getTotalStats, 
  getRecentReviews, 
  getTopReviewers 
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (type) {
      case 'most-reviewed':
        const mostReviewed = getMostReviewedProducts(limit);
        return NextResponse.json(mostReviewed);

      case 'trending':
        const trending = getTrendingProducts(limit);
        return NextResponse.json(trending);

      case 'stats':
        const stats = getTotalStats();
        return NextResponse.json(stats);

      case 'recent-reviews':
        const recentReviews = getRecentReviews(limit);
        return NextResponse.json(recentReviews);

      case 'top-reviewers':
        const topReviewers = getTopReviewers(limit);
        return NextResponse.json(topReviewers);

      case 'all':
      default:
        // Return all data for the explore page
        const allData = {
          mostReviewed: getMostReviewedProducts(5),
          trending: getTrendingProducts(5),
          stats: getTotalStats(),
          recentReviews: getRecentReviews(5),
          topReviewers: getTopReviewers(5)
        };
        return NextResponse.json(allData);
    }
  } catch (error) {
    console.error('Error in /api/explore:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
