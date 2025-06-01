'use client';

import { ProductCardGrid, ProductData } from '@/components/ProductCard';
import { LiveFeedback, SearchField, Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { ChangeEvent, useCallback, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface SearchError {
  message: string;
}

export const ProductSearch = ({ className }: { className?: string }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ProductData[]>([]);
  const [error, setError] = useState<SearchError | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleProductClick = (product: ProductData) => {
    router.push(`/product/${product.code}`);
  };

  // Debounced search function
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?name=${encodeURIComponent(query.trim())}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search error:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to search products'
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search with useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, searchProducts]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const renderContent = (): ReactNode => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <LiveFeedback
            label={{
              pending: 'Searching products...',
              success: 'Search completed',
              failed: 'Search failed'
            }}
            state="pending"
            className="w-full max-w-xs"
          >
            <div className="h-8"></div>
          </LiveFeedback>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <Typography variant="heading" level={3} className="mb-2">Search Error</Typography>
          <Typography className="text-gray-600">{error.message}</Typography>
        </div>
      );
    }

    if (hasSearched && results.length === 0 && searchTerm.trim()) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Typography variant="heading" level={3} className="mb-2">No Results Found</Typography>
          <Typography className="text-gray-600">
            No products found for &ldquo;{searchTerm}&rdquo;. Try a different search term.
          </Typography>
        </div>
      );
    }

    if (!hasSearched) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Typography variant="heading" level={3} className="mb-2">Search Products</Typography>
          <Typography className="text-gray-600">
            Start typing to search for products by name.
          </Typography>
        </div>
      );
    }

    return null;
  };

  const renderResults = (): ReactNode => {
    if (results.length > 0) {
      return (
        <div className="space-y-4">
          <Typography className="text-gray-600">
            Found {results.length} product{results.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
          </Typography>
          <ProductCardGrid
            products={results}
            interactive={false}
            onProductClick={handleProductClick}
            showRating={false}
            className="mt-4"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      {renderContent()}
      
      <SearchField
        label="Find an item..."
        value={searchTerm}
        onChange={handleSearchChange}
      />
      
      {renderResults()}
    </div>
  );
}