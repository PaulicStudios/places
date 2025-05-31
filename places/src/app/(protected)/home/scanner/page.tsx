'use client';

import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Page } from '@/components/PageLayout';
import { Button, Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { ScanBarcode, Package, BubbleStar } from 'iconoir-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id?: string;
  name?: string;
  description?: string;
  brand?: string;
  image?: string;
  code?: string;
}

export default function BarcodeScannerPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(true); // Start scanning immediately
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  const handleScanResult = async (code: string) => {
    // Stop scanning immediately when a result is found
    setIsScanning(false);
    
    // Try to lookup product information using search API
    setIsLookingUp(true);
    try {
      const response = await fetch(`/api/search?id=${encodeURIComponent(code)}`);
      if (response.ok) {
        const data = await response.json();
        
        // Handle both single product response and array response
        if (Array.isArray(data) && data.length > 0) {
          setScannedProduct({...data[0], code});
        } else if (!Array.isArray(data)) {
          setScannedProduct({...data, code});
        } else {
          // No products found, just save the code
          setScannedProduct({ code });
        }
      }
    } catch (error) {
      console.error('Failed to lookup product info:', error);
      // Just save the code if lookup fails
      setScannedProduct({ code });
    } finally {
      setIsLookingUp(false);
    }
  };

  const goToProductPage = (productId: string) => {
    if (!productId) return;
    router.push(`/home/product-demo?id=${encodeURIComponent(productId)}`);
  };

  const addReview = (productId: string) => {
    if (!productId) return;
    router.push(`/home/reviews/new?id=${encodeURIComponent(productId)}`);
  };

  const scanAgain = () => {
    setScannedProduct(null);
    setIsScanning(true);
  };

  return (
    <Page>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center mb-8">
          <Typography variant='heading' level={1}>Barcode Scanner</Typography>
          <Typography className="text-gray-500">
            Scan barcodes to get product information
          </Typography>
        </div>

        {isScanning ? (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <BarcodeScanner
                onScanResult={handleScanResult}
                onClose={() => setIsScanning(false)}
                autoStart={true}
                continuousScanning={false} /* Make sure this is false to stop after first scan */
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Loading indicator when looking up product */}
            {isLookingUp && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Looking up product information...
                </div>
              </div>
            )}

            {/* Product Info */}
            {!isLookingUp && scannedProduct && (
              <div className="border border-gray-200 rounded-lg p-6 shadow-md">
                {scannedProduct.image && (
                  <div className="flex justify-center mb-4">
                    <div className="relative h-64 w-full">
                      <Image 
                        src={scannedProduct.image} 
                        alt={scannedProduct.name || 'Product image'} 
                        className="rounded-lg object-contain"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {scannedProduct.name || 'Unknown Product'}
                  </h2>
                  
                  {scannedProduct.brand && (
                    <p className="text-gray-600">
                      by {scannedProduct.brand}
                    </p>
                  )}
                </div>

                {scannedProduct.description && (
                  <p className="text-gray-700 mb-6">
                    {scannedProduct.description}
                  </p>
                )}

                <div className="text-sm text-gray-500 font-mono mb-6">
                  Product ID: {scannedProduct.code || scannedProduct.id || 'Unknown'}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => goToProductPage(scannedProduct.id || scannedProduct.code || '')}
                    variant="secondary"
                    size="lg"
                    className="flex items-center justify-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Go to Product Page
                  </Button>
                  
                  <Button
                    onClick={() => addReview(scannedProduct.id || scannedProduct.code || '')}
                    variant="primary"
                    size="lg"
                    className="flex items-center justify-center gap-2"
                  >
                    <BubbleStar className="w-5 h-5" />
                    Add Review
                  </Button>
                </div>
              </div>
            )}

            {/* Scan again button */}
            <div className="flex justify-center mt-6">
              <Button
                onClick={scanAgain}
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
              >
                <ScanBarcode className="w-5 h-5" />
                Scan Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
