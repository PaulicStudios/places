import { NextRequest, NextResponse } from 'next/server';
import { findProduct, saveProduct } from '@/lib/db';

interface ProductInformation {
  code: string;
  codeType: string;
  name: string;
  description: string;
  image_url: string;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Get query parameters
  const id = searchParams.get('id');
  const name = searchParams.get('name');
  
  // Check for multiple parameters
  if (id && name) {
    return NextResponse.json(
      { error: 'Only one parameter (either id OR name) is allowed' }, 
      { status: 400 }
    );
  }

  try {
    // Check if searching by name
    if (name) {
      // Search the database only
      const results = findProduct({ name });
      
      // Return up to 10 entries
      return NextResponse.json(results.slice(0, 10));
    }
    
    // Otherwise, check if searching by id/barcode
    if (!id) {
      return NextResponse.json(
        { error: 'Either product ID or name is required' },
        { status: 400 }
      );
    }

    // Look up in our db
    const check_db = findProduct({ code: id });
    
    if (check_db.length > 0) {
      return NextResponse.json(check_db);
    }

    // If not found fetch from go-upc API
    const result = await fetch(`https://go-upc.com/api/v1/code/${id}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BARCODE_API_KEY}`
      }
    });

    // Check API response status
    if (!result.ok) {
      return NextResponse.json(
        { error: `API returned status code: ${result.status}` },
        { status: result.status }
      );
    }

    // Process and save API response
    const fullProductData = await result.json();
    const filteredData: ProductInformation = {
      code: fullProductData.code || '',
      codeType: fullProductData.codeType || '',
      name: fullProductData.product?.name || '',
      description: fullProductData.product?.description || '',
      image_url: fullProductData.product?.imageUrl || ''
    };

    try {
      saveProduct(filteredData);
    } catch (dbError) {
      console.error(`Database error: ${dbError}`);
    }

    return NextResponse.json(filteredData);
    
  } catch(err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
