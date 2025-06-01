'use client';

import { useState, useEffect } from 'react';
import { Page } from '@/components/PageLayout';
import { ProductCardGrid, ProductData } from '@/components/ProductCard';
import { StarRating } from '@/components/StarRating';
import { Typography, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { Reports, Star, Clock, FireFlame } from 'iconoir-react';
import { useRouter } from 'next/navigation';

interface ExploreStats {
  totalProducts: number;
  totalReviews: number;
}

interface RecentReview {
  review_id: number;
  product_code: string;
  description: string;
  stars: number;
  created_at: string;
  product_name: string;
  product_image: string;
}

interface TopReviewer {
  user_id: string;
  review_count: number;
  average_rating: number;
  last_review_date: string;
}

interface ProductWithStats extends ProductData {
  review_count: number;
  average_rating: number;
}

interface ExploreData {
  mostReviewed: ProductWithStats[];
  trending: ProductWithStats[];
  stats: ExploreStats;
  recentReviews: RecentReview[];
  topReviewers: TopReviewer[];
}

export default function ExplorePage() {
  const router = useRouter();
  const [data, setData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/explore?type=all');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const exploreData = await response.json();
        setData(exploreData);
      } catch (err) {
        console.error('Error fetching explore data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load explore data');
      } finally {
        setLoading(false);
      }
    };

    fetchExploreData();
  }, []);

  const handleProductClick = (product: ProductData) => {
    router.push(`/product/${product.code}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Page>
        <Page.Header className="p-0">
          <TopBar
            className="text-gray-900 gradient-bg"
            title="Explore"
          />
        </Page.Header>
        <Page.Main className="space-y-6 pb-20">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </Page.Main>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Page.Header className="p-0">
          <TopBar
            className="text-gray-900 gradient-bg"
            title="Explore"
          />
        </Page.Header>
        <Page.Main className="space-y-6 pb-20">
          <div className="text-center py-20">
            <Typography variant="heading" level={3} className="text-red-600 mb-2">
              Error loading data
            </Typography>
            <Typography className="text-gray-600">{error}</Typography>
          </div>
        </Page.Main>
      </Page>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Page>
      <Page.Header className="p-0">
        <TopBar
          className="text-gray-900 gradient-bg"
          title="Explore"
        />
      </Page.Header>
      
      <Page.Main className="space-y-6 pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Reports className="w-8 h-8 text-blue-600" />
            </div>
            <Typography variant="heading" level={2} className="text-2xl font-bold text-gray-900 mb-1">
              {data.stats.totalProducts}
            </Typography>
            <Typography className="text-gray-600 text-sm">
              Total Products
            </Typography>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <Typography variant="heading" level={2} className="text-2xl font-bold text-gray-900 mb-1">
              {data.stats.totalReviews}
            </Typography>
            <Typography className="text-gray-600 text-sm">
              Total Reviews
            </Typography>
          </div>
        </div>

        {/* Most Reviewed Products */}
        {data.mostReviewed.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <FireFlame className="w-6 h-6 text-green-600" />
              <Typography variant="heading" level={2} className="text-xl font-bold text-gray-900">
                Most Reviewed Products
              </Typography>
            </div>
            <ProductCardGrid
              products={data.mostReviewed.map(product => ({
                ...product,
                id: product.code
              }))}
              onProductClick={handleProductClick}
              showRating={false}
              className="grid-cols-1 sm:grid-cols-2"
            />
          </div>
        )}

        {/* Trending Products */}
        {data.trending.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-yellow-500" />
              <Typography variant="heading" level={2} className="text-xl font-bold text-gray-900">
                Trending Products
              </Typography>
              <Typography className="text-gray-600 text-sm">
                (Highest Average Ratings)
              </Typography>
            </div>
            <ProductCardGrid
              products={data.trending.map(product => ({
                ...product,
                id: product.code
              }))}
              onProductClick={handleProductClick}
              showRating={false}
              className="grid-cols-1 sm:grid-cols-2"
            />
          </div>
        )}

        {/* Recent Reviews */}
        {data.recentReviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
              <Typography variant="heading" level={2} className="text-xl font-bold text-gray-900">
                Recent Reviews
              </Typography>
            </div>
            <div className="space-y-4">
              {data.recentReviews.map((review) => (
                <div key={review.review_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Typography variant="heading" level={4} className="font-semibold mb-1">
                        {review.product_name || 'Unknown Product'}
                      </Typography>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating value={review.stars} size="sm" />
                        <Typography className="text-gray-600 text-sm">
                          {review.stars}/5
                        </Typography>
                        <Typography className="text-gray-500 text-xs">
                          {formatDate(review.created_at)}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  <Typography className="text-gray-700 leading-relaxed">
                    {review.description}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        )}
      </Page.Main>
    </Page>
  );
}
