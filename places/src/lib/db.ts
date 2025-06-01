import { ReviewSubmissionDB } from '@/components/Reviews';
import Database from 'better-sqlite3';

const dbPath = process.env.PATH_TO_DB;

// Singleton pattern - only create one database connection
let _db: Database.Database | null = null;

export function db(): Database.Database {
  // check if db is available if not create a new instance and make a table
  if (!_db) {
    _db = new Database(dbPath);
    
    _db.exec(`
      CREATE TABLE IF NOT EXISTS products(
        code TEXT PRIMARY KEY NOT NULL,
        codeType TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL
      );
    `);

    _db.exec(`
      CREATE TABLE IF NOT EXISTS reviews(
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT NOT NULL,
        description TEXT NOT NULL,
        stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
        transactional_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    MockDataProducts();
    MockDataReviews();
  }

  //always return the instance of the db
  return _db;
}

export function findProduct({ name, code }: { name?: string; code?: string }) {
  const database = db();
  
  if (code) {
    // looking for exact match
    return database.prepare('SELECT * FROM products WHERE code = ?').all(code);
  } 
  else if (name) {
    // lookin if the name is kinda like the product
    return database.prepare('SELECT * FROM products WHERE name LIKE ?').all(`%${name}%`);
  }
  return [];
}

export function saveProduct(product: {
  code: string;
  codeType: string;
  name: string;
  description: string;
  image_url: string;
}) {
  const database = db();
  
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO products (code, codeType, name, description, image_url)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    product.code, 
    product.codeType, 
    product.name, 
    product.description, 
    product.image_url
  );
}

export function getProductByCode(code: string) {
  const database = db();
  return database.prepare('SELECT * FROM products WHERE code = ?').get(code);
}

export function AverageStars(id: string) {
  const database = db();
  
  // Get all star ratings for the product
  const allStars = (database.prepare(`
    SELECT stars FROM reviews
    WHERE product_code = ?
    ORDER BY stars
  `).all(id) as { stars: number }[]).map(row => row.stars);
  
  let median = 0;
  if (allStars.length > 0) {
    const mid = Math.floor(allStars.length / 2);
    const rawMedian = allStars.length % 2 !== 0
      ? allStars[mid]
      : (allStars[mid - 1] + allStars[mid]) / 2;
    
    // Format to one decimal place
    median = Math.round(rawMedian * 10) / 10;
  }
  
  return median;
}

export function saveReview(review: ReviewSubmissionDB) {
  const database = db();
  
  const stmt = database.prepare(`
    INSERT INTO reviews (product_code, description, stars, transactional_id)
    VALUES (?, ?, ?, ?)
  `);
  
  return stmt.run(
    review.product_code,
    review.description,
    review.stars,
    review.transactionId
  );
}

export function findPagenatedReviews(id: string, fromReview: number = 1, toReview: number) {
  const database = db();
  
  const offset = Math.max(0, fromReview - 1);
  const limit = toReview - fromReview + 1;
  
  return database.prepare(`
    SELECT * FROM reviews 
    WHERE product_code = ? 
    ORDER BY created_at DESC, review_id DESC
    LIMIT ? OFFSET ?
  `).all(id, limit, offset);
}

export function getTotalReviewCount(id: string) {
  const database = db();
  
  const result = database.prepare(`
    SELECT COUNT(*) as count 
    FROM reviews 
    WHERE product_code = ?
  `).get(id) as { count: number };
  
  return result.count;
}

export function findAllReviews(id: string) {
  const database = db();
  
  return database.prepare(`
    SELECT * FROM reviews 
    WHERE product_code = ? 
    ORDER BY review_id DESC
  `).all(id);
}

export function MockDataReviews() {
  const database = db();

  // Correct the SQL statement to include created_at
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO reviews (product_code, name, description, stars, created_at)
    VALUES (?, ?, ?, ?, ?)
    `);
  
  const reviews = [
    {
      product_code: '5449000000996',
      name: 'Coca-Cola Classic',
      description: 'Hi im a sugar addict! Love it.',
      stars: 5,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5449000000996',
      name: 'Coca-Cola Classic',
      description: 'Im gay.',
      stars: 1,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5449000000996',
      name: 'Coca-Cola Classic',
      description: 'Random Bullshit kawungabunga.',
      stars: 3,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654042',
      name: 'Sprite',
      description: 'Sprite > Cola',
      stars: 4,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654042',
      name: 'Sprite',
      description: 'Shut up Meg!!!111!!!!',
      stars: 1,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654042',
      name: 'Sprite',
      description: 'Im a nigerian prince donate me eth to 0x000000000 so that I can send you 10k',
      stars: 5,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654035',
      name: 'Fanta Orange',
      description: 'Ja ist halte ne Fanta ne...',
      stars: 3,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654035',
      name: 'Fanta Orange',
      description: 'Ich mag auch keine Fanta',
      stars: 3,
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654035',
      name: 'Fanta Orange',
      description: 'Ich bin nich mainstream deswegen fanta!',
      stars: 4,
      created_at: new Date().toISOString()
    },
  ];

  for (const review of reviews) {
    stmt.run(
      review.product_code,
      review.name,
      review.description,
      review.stars,
      review.created_at
    );
  }
}

export function MockDataProducts() {
  const database = db();
  
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO products (code, codeType, name, description, image_url)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  // Sample product data
  const products = [
    {
      code: '5449000000996',
      codeType: 'UPC-A',
      name: 'Coca-Cola Classic',
      description: 'Original taste soft drink with sugar and sweeteners',
      image_url: 'https://www.desertcart.in/products/18597322-coca-cola-original-12-fl-oz-cans-24-pack'
    },
    {
      code: '5000112654042',
      codeType: 'UPC-A',
      name: 'Sprite',
      description: 'Lemon and lime flavoured soft drink with sugar and sweetener',
      image_url: 'https://www.coca-cola.com/content/dam/onexp/de/de/home-images/brands-images/fanta/fanta-desktop-v2.png'
    },
    {
      code: '5000112654035',
      codeType: 'UPC-A',
      name: 'Fanta Orange',
      description: 'Orange flavoured soft drink with sugar and sweeteners',
      image_url: 'https://www.coca-cola.com/content/dam/onexp/de/de/home-images/brands-images/fanta/fanta-desktop-v2.png'
    },
  ];
  
  // Insert all products
  const results = products.map(product => {
    return stmt.run(
      product.code,
      product.codeType,
      product.name,
      product.description,
      product.image_url
    );
  });
  
  return {
    insertedCount: results.filter(r => r.changes > 0).length,
    totalAttempted: products.length
  };
}
