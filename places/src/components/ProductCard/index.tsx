'use client';

import { StarRating } from '@/components/StarRating';
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
            <div className="text-gray-400 text-sm">No image available</div>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {product.name || 'Unknown Product'}
          </h3>
          
          {/* Code Information */}
          {product.code && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {product.codeType || 'CODE'}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {product.code}
              </span>
            </div>
          )}
        </div>

        {/* Product Description */}
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
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
