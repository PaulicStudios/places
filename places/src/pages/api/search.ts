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
  // get array of id's
  const { id } = req.query;
  
  try {
    // check if url is correctly put together
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // look up in our db
    const productCode = Array.isArray(id) ? id[0] : id;
    const check_db = findProduct({ code: productCode });
    if (check_db.length > 0) {
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
        // potentially check here if it changes
      } else {
        // do something if it doesn't change
      }
    } catch (dbError) {
      console.error(`Database error: ${dbError}`);
    }

    return res.status(200).json(filteredData);
    
  } catch(err) {
    // if anything goes wrong we print out what and send a generic 500 http status code
    console.log(`Error caught in /api/search: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
