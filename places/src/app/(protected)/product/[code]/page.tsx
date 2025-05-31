'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductData } from '@/components/ProductCard';
import { StarRating } from '@/components/StarRating';
import { Page } from '@/components/PageLayout';
import { TopBar, Typography, Chip } from '@worldcoin/mini-apps-ui-kit-react';
import { Barcode, Hashtag } from 'iconoir-react';
import Link from 'next/link';
import Image from 'next/image';

interface Review {
  review_id: number;
  product_code: string;
  name: string;
  description: string;
  stars: number;
  created_at?: string;
}

interface ReviewsResponse {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
}

export default function ProductPage() {
  const params = useParams();
  const code = params.code as string;
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product details
        const productResponse = await fetch(`/api/products/${code}`);
        if (!productResponse.ok) {
          throw new Error('Product not found');
        }
        const productData = await productResponse.json();
        
        // Fetch reviews
        const reviewsResponse = await fetch(`/api/reviews/${code}`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }
        
        setProduct({
          code: productData.code,
          codeType: productData.codeType,
          name: productData.name,
          description: productData.description,
          image_url: productData.image || ''
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code]);


  if (loading) {
    return (
      <Page>
        <Page.Header className="p-0">
          <TopBar
            className="text-gray-900 gradient-bg"
            title="Product Details"
            startAdornment={
              <Link href="/home" className="text-gray-900 hover:text-gray-600 transition-colors">
                ← Back
              </Link>
            }
          />
        </Page.Header>
        <Page.Main className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-2">
              <Typography variant="heading" level={3} className="text-gray-900">
                Loading Product
              </Typography>
              <Typography className="text-gray-600">
                Please wait while we fetch the details...
              </Typography>
            </div>
          </div>
        </Page.Main>
      </Page>
    );
  }

  if (error || !product) {
    return (
      <Page>
        <Page.Header className="p-0">
          <TopBar
            className="text-gray-900 gradient-bg"
            title="Product Details"
            startAdornment={
              <Link href="/home" className="text-gray-900 hover:text-gray-600">
                ← Back
              </Link>
            }
          />
        </Page.Header>
        <Page.Main className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <Typography className="text-red-600">
              {error || 'Product not found'}
            </Typography>
            <Link href="/home" className="hover:underline">
              Go back to home
            </Link>
          </div>
        </Page.Main>
      </Page>
    );
  }

  return (
    <Page>
      <Page.Header className="p-0">
        <TopBar
          className="text-gray-900 gradient-bg"
          title="Product Details"
          startAdornment={
            <Link href="/home" className="text-gray-900 hover:text-gray-600 transition-colors">
              ← Back
            </Link>
          }
        />
      </Page.Header>
      
      <Page.Main className="space-y-6 pb-20">
        <div className="px-4">
          <div>
            <div className="relative h-64 w-full">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name || 'Product image'}
                  fill
                  className="object-cover rounded-xl"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Typography className="text-gray-500 text-sm">No image available</Typography>
                  </div>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="p-6 space-y-5">
              {/* Header Section */}
              <div className="space-y-3">
                <Typography variant="heading" level={1} className="text-2xl font-bold text-gray-900 leading-tight">
                  {product.name || 'Unknown Product'}
                </Typography>
                
                {/* Rating Display */}
                {reviews && reviews.totalReviews > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <StarRating value={reviews.averageRating} size="md" allowHalf />
                      <Typography className="font-semibold text-lg text-gray-900">
                        {reviews.averageRating.toFixed(1)}
                      </Typography>
                    </div>
                    <Typography className="text-gray-600">
                      ({reviews.totalReviews} {reviews.totalReviews === 1 ? 'review' : 'reviews'})
                    </Typography>
                  </div>
                )}
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="space-y-2">
                  <Typography className="font-semibold text-gray-900">
                    Description
                  </Typography>
                  <Typography className="text-gray-700 leading-relaxed">
                    {product.description}
                  </Typography>
                </div>
              )}

              {/* Product Codes */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Chip
                  icon={<Barcode />}
                  label={product.codeType || 'CODE'}
                />
                <Chip
                  label={product.code}
                  icon={<Hashtag />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="px-4 space-y-4">
          {/* Reviews Header */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center space-y-3">
              <Typography variant="heading" level={2} className="text-xl font-bold text-gray-900">
                Customer Reviews
              </Typography>
              {reviews && reviews.totalReviews > 0 && (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <StarRating value={reviews.averageRating} size="md" allowHalf />
                    <Typography className="font-semibold text-lg text-gray-900">
                      {reviews.averageRating.toFixed(1)}
                    </Typography>
                  </div>
                  <Typography className="text-gray-600">
                    Based on {reviews.totalReviews} {reviews.totalReviews === 1 ? 'review' : 'reviews'}
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {/* Reviews List */}
          {reviews && reviews.reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.reviews.map((review, index) => (
                <div key={review.review_id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <Typography className="text-white font-semibold text-sm">
                          {review.name.charAt(0).toUpperCase()}
                        </Typography>
                      </div>
                      <div>
                        <Typography className="font-semibold text-gray-900">
                          {review.name}
                        </Typography>
                        {review.created_at && (
                          <Typography className="text-gray-500 text-sm">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating value={review.stars} size="sm" />
                      <Typography className="font-semibold text-gray-700 text-sm">
                        {review.stars}/5
                      </Typography>
                    </div>
                  </div>
                  
                  <Typography className="text-gray-700 leading-relaxed">
                    {review.description}
                  </Typography>
                  
                  {index === 0 && reviews.reviews.length > 1 && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm font-medium mt-3 pt-3 border-t border-gray-100">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Most Recent Review
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <Typography variant="heading" level={3} className="text-gray-900">
                    No reviews yet
                  </Typography>
                  <Typography className="text-gray-500 text-sm">
                    Be the first to share your experience with this product!
                  </Typography>
                </div>
              </div>
            </div>
          )}
        </div>
      </Page.Main>
    </Page>
  );
}
