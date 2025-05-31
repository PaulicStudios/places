'use client';

import { StarRating } from '@/components/StarRating';
import { Typography } from '@worldcoin/mini-apps-ui-kit-react';
import Image from 'next/image';
import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

/**
 * Product data structure that matches the database schema
 * This component follows Worldcoin UI kit styling guidelines
 */
export interface ProductData {
  id?: string;
  code: string;
  codeType: string;
  name: string;
  description: string;
  image_url: string;
}

interface ProductCardProps {
  product: ProductData;
  rating?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  onProductClick?: (product: ProductData) => void;
  className?: string;
  showRating?: boolean;
}

/**
 * ProductCard component displays product information in a card layout
 * following Worldcoin UI kit design system guidelines.
 * 
 * Features:
 * - Product image with fallback
 * - Product name and description with proper typography
 * - Code/barcode information display
 * - Optional interactive star rating
 * - Haptic feedback on interactions
 * - Responsive design
 */
export const ProductCard = ({
  product,
  rating = 0,
  interactive = false,
  onRatingChange,
  onProductClick,
  className = '',
  showRating = true,
}: ProductCardProps) => {
  const [currentRating, setCurrentRating] = useState(rating);

  const handleRatingChange = (newRating: number) => {
    setCurrentRating(newRating);
    if (interactive && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleCardClick = () => {
    if (onProductClick) {
      MiniKit.commands.sendHapticFeedback({
        hapticsType: 'impact',
        style: 'light'
      });
      onProductClick(product);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Replace with a placeholder image or hide the image
    e.currentTarget.style.display = 'none';
  };

  return (
    <div 
      className={`flex flex-col w-full border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 ${className}`}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative h-48 w-full bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name || 'Product image'}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized // For external URLs
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <Typography className="text-gray-600">No image available</Typography>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <div>
          <Typography variant="heading" level={3} className="line-clamp-2">
            {product.name || 'Unknown Product'}
          </Typography>
          
          {/* Code Information */}
          {product.code && (
            <div className="flex items-center gap-2 mt-1">
              <Typography className="font-medium text-gray-600 uppercase tracking-wide" level={5}>
                {product.codeType || 'CODE'}
              </Typography>
              <Typography className="text-gray-600 font-mono" level={5}>
                {product.code}
              </Typography>
            </div>
          )}
        </div>

        {/* Product Description */}
        {product.description && (
          <Typography className="text-gray-600 line-clamp-3 leading-relaxed">
            {product.description}
          </Typography>
        )}

        {/* Star Rating */}
        {showRating && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Rating
              </span>
              <StarRating
                value={currentRating}
                interactive={interactive}
                onChange={handleRatingChange}
                size="sm"
                maxStars={5}
                allowHalf={true}
                className="ml-2"
              />
            </div>
            {currentRating > 0 && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {currentRating.toFixed(1)} out of 5
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ProductCardGrid component for displaying multiple products in a responsive grid
 */
interface ProductCardGridProps {
  products: ProductData[];
  interactive?: boolean;
  onRatingChange?: (productCode: string, rating: number) => void;
  onProductClick?: (product: ProductData) => void;
  className?: string;
  showRating?: boolean;
}

export const ProductCardGrid = ({
  products,
  interactive = false,
  onRatingChange,
  onProductClick,
  className = '',
  showRating = true,
}: ProductCardGridProps) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.code || product.id}
          product={product}
          interactive={interactive}
          onRatingChange={(rating) => onRatingChange?.(product.code, rating)}
          onProductClick={onProductClick}
          showRating={showRating}
        />
      ))}
    </div>
  );
};
