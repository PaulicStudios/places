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

// New functions for explore stats
export function getMostReviewedProducts(limit: number = 10) {
  const database = db();
  
  return database.prepare(`
    SELECT 
      p.*,
      COUNT(r.review_id) as review_count,
      AVG(r.stars) as average_rating
    FROM products p
    LEFT JOIN reviews r ON p.code = r.product_code
    GROUP BY p.code
    HAVING COUNT(r.review_id) > 0
    ORDER BY review_count DESC, average_rating DESC
    LIMIT ?
  `).all(limit);
}

export function getTrendingProducts(limit: number = 10) {
  const database = db();
  
  // Products with highest average ratings and at least 2 reviews
  return database.prepare(`
    SELECT 
      p.*,
      COUNT(r.review_id) as review_count,
      AVG(r.stars) as average_rating
    FROM products p
    LEFT JOIN reviews r ON p.code = r.product_code
    GROUP BY p.code
    HAVING COUNT(r.review_id) >= 2
    ORDER BY average_rating DESC, review_count DESC
    LIMIT ?
  `).all(limit);
}

export function getTotalStats() {
  const database = db();
  
  const productCount = database.prepare(`SELECT COUNT(*) as count FROM products`).get() as { count: number };
  const reviewCount = database.prepare(`SELECT COUNT(*) as count FROM reviews`).get() as { count: number };
  
  return {
    totalProducts: productCount.count,
    totalReviews: reviewCount.count
  };
}

export function getRecentReviews(limit: number = 10) {
  const database = db();
  
  return database.prepare(`
    SELECT 
      r.*,
      p.name as product_name,
      p.image_url as product_image
    FROM reviews r
    LEFT JOIN products p ON r.product_code = p.code
    ORDER BY r.created_at DESC
    LIMIT ?
  `).all(limit);
}

export function getTopReviewers(limit: number = 10) {
  const database = db();
  
  // For this demo, we'll group by transactional_id as a proxy for user
  // In a real app, you'd have a users table
  return database.prepare(`
    SELECT 
      transactional_id as user_id,
      COUNT(*) as review_count,
      AVG(stars) as average_rating,
      MAX(created_at) as last_review_date
    FROM reviews
    GROUP BY transactional_id
    ORDER BY review_count DESC, average_rating DESC
    LIMIT ?
  `).all(limit);
}

export function MockDataReviews() {
  const database = db();

  // Correct the SQL statement to match the table schema
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO reviews (product_code, description, stars, transactional_id, created_at)
    VALUES (?, ?, ?, ?, ?)
    `);
  
  const reviews = [
    {
      product_code: '5449000000996',
      description: 'Hi im a sugar addict! Love it.',
      stars: 5,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5449000000996',
      description: 'Tasts like Pisswasser from GTA5!',
      stars: 1,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5449000000996',
      description: 'Random Bullshit kawungabunga.',
      stars: 3,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654042',
      description: 'Sprite > Cola',
      stars: 4,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654042',
      description: 'Hab schon bessere Getraenke weggekippt!',
      stars: 1,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654042',
      description: 'Ad and Reality are 1:1 the same, simply amazing!',
      stars: 5,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654035',
      description: 'Ja ist halte ne Fanta ne...',
      stars: 3,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654035',
      description: 'Ich mag auch keine Fanta',
      stars: 3,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '5000112654035',
      description: 'Ich bin nich mainstream deswegen fanta!',
      stars: 4,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9783608935431',
      description: 'Habs halb durch geschafft, danach war ich gelangweilt...',
      stars: 3,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9783608935431',
      description: 'This book is a book, probably one of the best! -Trump',
      stars: 5,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9783608935431',
      description: 'Books good, would recommend!',
      stars: 5,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9780140449266',
      description: 'A classic journey through myth and adventure. Timeless!',
      stars: 5,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9783423131434',
      description: 'Dark and thought-provoking, but a bit heavy at times.',
      stars: 3,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9783257228007',
      description: 'Interesting read, though the pacing felt slow in parts.',
      stars: 4,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9783608935431',
      description: 'Rich world-building, but a bit too dense for my taste.',
      stars: 2,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9780140449266',
      description: 'Beautiful language and storytelling, though not easy to follow.',
      stars: 4,
      transactional_id: '',
      created_at: new Date().toISOString()
    },
    {
      product_code: '9783423131434',
      description: 'Unsettling and powerful. Definitely leaves an impression.',
      stars: 5,
      transactional_id: '',
      created_at: new Date().toISOString()
    }
  ];

  for (const review of reviews) {
    stmt.run(
      review.product_code,
      review.description,
      review.stars,
      review.transactional_id,
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
      image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      code: '5000112654042',
      codeType: 'UPC-A',
      name: 'Sprite',
      description: 'Lemon and lime flavoured soft drink with sugar and sweetener',
      image_url: 'https://images.unsplash.com/photo-1690988109041-458628590a9e?q=80&w=2076&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      code: '5000112654035',
      codeType: 'UPC-A',
      name: 'Fanta Orange',
      description: 'Orange flavoured soft drink with sugar and sweeteners',
      image_url: 'https://www.coca-cola.com/content/dam/onexp/de/de/home-images/brands-images/fanta/fanta-desktop-v2.png'
    },
    {
      code:	'9783608935431',
      codeType:	'ISBN',
      name:	'J. R. R. Tolkie Der Herr Der Ringe',
      description:	'No description found.',
      image_url: "https://images.unsplash.com/photo-1595538934869-503c9448981b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      code: '9780140449266',
      codeType: 'ISBN',
      name: 'Homer Die Odyssee',
      description: 'No description found.',
      image_url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      code: '9783423131434',
      codeType: 'ISBN',
      name: 'Franz Kafka Die Verwandlung',
      description: 'No description found.',
      image_url: 'https://images.unsplash.com/photo-1665441233504-e0b42355d0d8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      code: '9783257228007',
      codeType: 'ISBN',
      name: 'Hermann Hesse Der Steppenwolf',
      description: 'No description found.',
      image_url: 'https://images.unsplash.com/photo-1477240489935-6c96abea2aba?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
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
