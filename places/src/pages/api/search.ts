import { NextApiRequest, NextApiResponse } from 'next';

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
  const { id } = req.query;
  
  try {
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const result = await fetch(`https://go-upc.com/api/v1/code/${id}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BARCODE_API_KEY}`
      }
    });

    if (!result.ok) {
      console.log(`Result from /api/search not 200 instead ${result.status}`);
      return res.status(result.status).json({ 
        error: `API returned status code: ${result.status}` 
      });
    }

    const fullProductData = await result.json();
    
    // Extract only the fields we want to return
    const filteredData: ProductInformation = {
      code: fullProductData.code || '',
      codeType: fullProductData.codeType || '',
      name: fullProductData.product?.name || '',
      description: fullProductData.product?.description || '',
      image_url: fullProductData.product?.imageUrl || ''
    };
    
    return res.status(200).json(filteredData);
    
  } catch(err) {
    console.log(`Error caught in /api/search: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
