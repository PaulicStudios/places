import { NextApiRequest, NextApiResponse } from 'next';
import { findProduct, saveProduct } from '@/lib/db'

interface ProductInformation {
  code: string;
  codeType: string;
  name: string;
  description: string;
  image_url: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[DEBUG] Request received: ${req.method} ${req.url}`);
  console.log(`[DEBUG] Query parameters:`, req.query);
  
  // Properly check for multiple query parameters
  const queryKeys = Object.keys(req.query);
  console.log(`[DEBUG] Query keys:`, queryKeys);
  
  // This checks if we have both id AND name, or any other unexpected parameters
  if ((queryKeys.includes('id') && queryKeys.includes('name')) || queryKeys.length > 1) {
    console.log(`[DEBUG] Multiple query parameters detected: ${queryKeys.join(', ')}`);
    return res.status(400).json({ 
      error: 'Only one parameter (either id OR name) is allowed',
      receivedParams: queryKeys
    });
  }

  // get query parameters
  const { id, name } = req.query;
  console.log(`[DEBUG] Extracted id: ${id}, name: ${name}`);

  try {
    // Check if searching by name
    if (name) {
      // Convert potential array to single string
      const searchName = Array.isArray(name) ? name[0] : name;
      console.log(`[DEBUG] Searching database for name: "${searchName}"`);
      
      // Only search the database, don't make API calls
      const results = findProduct({ name: searchName });
      console.log(`[DEBUG] Found ${results.length} results for name: "${searchName}"`);
      
      // Return up to 10 entries
      return res.status(200).json(results.slice(0, 10));
    }
    
    // Otherwise, check if searching by id/barcode
    if (!id) {
      console.log(`[DEBUG] No search parameters provided`);
      return res.status(400).json({ error: 'Either product ID or name is required' });
    }

    // look up in our db
    const productCode = Array.isArray(id) ? id[0] : id;
    console.log(`[DEBUG] Searching database for product code: "${productCode}"`);
    
    const check_db = findProduct({ code: productCode });
    console.log(`[DEBUG] Database search results: ${check_db.length} items found`);
    
    if (check_db.length > 0) {
      console.log(`[DEBUG] Returning product from database`);
      return res.status(200).json(check_db);
    }

    // if not found fetch it from go-upc
    const result = await fetch(`https://go-upc.com/api/v1/code/${id}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BARCODE_API_KEY}`
      }
    });

    // check http status code and take action if it's not 200
    if (!result.ok) {
      console.log(`Result from /api/search not 200 instead ${result.status}`);
      return res.status(result.status).json({ 
        error: `API returned status code: ${result.status}` 
      });
    }

    // if successful, jsonify and put it into a interface that we save in db and return
    const fullProductData = await result.json();
    const filteredData: ProductInformation = {
      code: fullProductData.code || '',
      codeType: fullProductData.codeType || '',
      name: fullProductData.product?.name || '',
      description: fullProductData.product?.description || '',
      image_url: fullProductData.product?.imageUrl || ''
    };

    try {
      const db_result = saveProduct(filteredData);

      if (db_result.changes > 0) {
        console.log(`Product saved to database with ID: ${db_result.lastInsertRowid}`);
      } else {
        console.warn(`Failed to save product to database: no rows changed`);
      }
    } catch (dbError) {
      console.error(`Database error: ${dbError}`);
    }

    return res.status(200).json(filteredData);
    
  } catch(err) {
    console.log(`Error caught in /api/search: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
