'use client';

import { ProductCard, ProductCardGrid, ProductData } from '@/components/ProductCard';
import { Page } from '@/components/PageLayout';
import { ProductSearch } from '@/components/ProductSearch';

// Sample product data that matches the database structure
const sampleProducts: ProductData[] = [
  {
    id: '1',
    code: '123456789012',
    codeType: 'UPC',
    name: 'Premium Coffee Beans',
    description: 'Rich and aromatic coffee beans sourced from the mountains of Colombia. Perfect for brewing espresso or drip coffee.',
    image_url: 'https://images.unsplash.com/photo-1559056961-84a3af215b84?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    code: '987654321098',
    codeType: 'EAN',
    name: 'Organic Green Tea',
    description: 'Premium organic green tea leaves with natural antioxidants. Calming and refreshing.',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    code: '456789123456',
    codeType: 'UPC',
    name: 'Artisan Dark Chocolate',
    description: 'Handcrafted dark chocolate with 70% cocoa content. Made with ethically sourced cacao beans.',
    image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    code: '789123456789',
    codeType: 'EAN',
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    code: '321654987321',
    codeType: 'UPC',
    name: 'Sample Product (No Image)',
    description: 'This is a sample product without an image to demonstrate the fallback display.',
    image_url: '',
  },
];

export default function ProductCardDemo() {
  const handleRatingChange = (productCode: string, rating: number) => {
    console.log(`Product ${productCode} rated: ${rating} stars`);
  };

  return (
    <Page>
      <Page.Header>
        <h1 className="text-2xl font-bold text-gray-900">Product Demo</h1>
        <p className="text-sm text-gray-600 mt-1">
          Product search and display functionality
        </p>
      </Page.Header>

      <Page.Main className="space-y-8">
        {/* Product Search */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Product Search
          </h2>
          <div className="mb-6">
            <ProductSearch />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Single Product Card - Interactive */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Interactive Product Card
          </h2>
          <div className="max-w-sm">
            <ProductCard
              product={sampleProducts[0]}
              rating={4.5}
              interactive={true}
              onRatingChange={(rating) => 
                console.log(`Coffee rated: ${rating} stars`)
              }
            />
          </div>
        </section>

        {/* Single Product Card - Read-only */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Read-only Product Card
          </h2>
          <div className="max-w-sm">
            <ProductCard
              product={sampleProducts[1]}
              rating={3.8}
              interactive={false}
            />
          </div>
        </section>

        {/* Product Card without Rating */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Product Card without Rating
          </h2>
          <div className="max-w-sm">
            <ProductCard
              product={sampleProducts[4]}
              showRating={false}
            />
          </div>
        </section>

        {/* Product Grid */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Product Grid
          </h2>
          <ProductCardGrid
            products={sampleProducts}
            interactive={true}
            onRatingChange={handleRatingChange}
          />
        </section>
     
      </Page.Main>
    </Page>
  );
}
