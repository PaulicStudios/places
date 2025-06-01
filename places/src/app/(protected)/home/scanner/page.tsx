'use client';

import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Page } from '@/components/PageLayout';
import { Button, SkeletonTypography, TopBar, Typography } from '@worldcoin/mini-apps-ui-kit-react';
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
    router.push(`/product/${encodeURIComponent(productId)}`);
  };

  const addReview = (productId: string) => {
    if (!productId) return;
    router.push(`/review/new/${encodeURIComponent(productId)}`);
  };

  const scanAgain = () => {
    setScannedProduct(null);
    setIsScanning(true);
  };

  return (
    <Page>
      <Page.Header className="p-0">
        <TopBar
          className="text-gray-900 gradient-bg"
          title="Barcode Scanner"
        />
      </Page.Header>
      <Page.Main>

      <div className="container mx-auto px-4 py-2 max-w-2xl">
        <div className="text-center mb-8">
          <Typography className="text-gray-900">
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
          <div className="space-y-4">
            {/* Loading indicator when looking up product */}
            {isLookingUp && (
               <div className="border border-gray-200 rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                </div>
                <Typography className="text-center font-medium mb-4">Looking up product information...</Typography>
                <SkeletonTypography
                  level={2}
                  variant="heading"
                />
                <SkeletonTypography
                  level={2}
                  lines={2}
                  variant="body"
                />
                <Typography className="text-center text-gray-600 mt-4">
                  This may take a moment, please wait...
                </Typography>
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
                  <Typography level={2} variant='heading'>
                    {scannedProduct.name || 'Unknown Product'}
                  </Typography>
                  
                  {scannedProduct.brand && (
                    <Typography className="text-gray-600">
                      by {scannedProduct.brand}
                    </Typography>
                  )}
                </div>

                {scannedProduct.description && (
                  <Typography className="text-gray-600 mb-6">
                    {scannedProduct.description}
                  </Typography>
                )}

                <Typography className="font-mono mb-6 text-gray-600">
                  Product ID: {scannedProduct.code || scannedProduct.id || 'Unknown'}
                </Typography>

                <div className="flex flex-col sm:flex-row gap-3 mt-2">
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
      </Page.Main>
    </Page>
  );
}
