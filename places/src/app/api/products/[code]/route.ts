import { NextRequest, NextResponse } from 'next/server';
import { getProductByCode, saveProduct } from '@/lib/db';

interface ExternalProductResponse {
  product?: {
    title?: string;
    description?: string;
    brand?: string;
    images?: string[];
  };
}

type ExternalProduct = {
  name: string;
  description: string;
  brand?: string;
  image?: string | null;
};

async function fetchFromExternalAPI(code: string): Promise<ExternalProduct | null> {
  const apiKey = process.env.BARCODE_API_KEY;
  
  if (!apiKey) {
    console.warn('BARCODE_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`https://go-upc.com/api/v1/code/${code}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Product not found in external API
      }
      throw new Error(`External API error: ${response.status}`);
    }

    const data: ExternalProductResponse = await response.json();
    
    if (data.product) {
      return {
        name: data.product.title || 'Unknown Product',
        description: data.product.description || 'No description available',
        brand: data.product.brand,
        image: data.product.images?.[0] || null,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching from external API:', error);
    return null;
  }
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

    // First try to get from local database
    type Product = {
      code: string;
      codeType: string;
      name: string;
      description: string;
      brand?: string;
      image_url?: string;
    };
    
    let product: Product | null = getProductByCode(code) as Product | null;
    
    if (!product) {
      // Try to fetch from external API
      const externalProduct = await fetchFromExternalAPI(code);
      
      if (externalProduct) {
        // Save to local database for future requests
        const productToSave = {
          code,
          codeType: 'UPC', // Default type, could be enhanced to detect type
          name: externalProduct.name,
          description: externalProduct.description,
          image_url: externalProduct.image || '',
        };
        
        try {
          saveProduct(productToSave);
          product = productToSave;
        } catch (saveError) {
          console.error('Error saving product to database:', saveError);
          // Still return the external product even if save fails
          product = productToSave;
        }
      }
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: product.name,
      description: product.description,
      brand: product.brand || undefined,
      image: product.image_url || undefined,
      code: product.code,
      codeType: product.codeType,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
