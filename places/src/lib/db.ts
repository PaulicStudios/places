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
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    loadDumbShit();
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

export function saveReview(review: {
  product_code: string;
  name: string;
  description: string;
  stars: number;
}) {
  const database = db();
  
  const stmt = database.prepare(`
    INSERT INTO reviews (product_code, name, description, stars)
    VALUES (?, ?, ?, ?)
  `);
  
  return stmt.run(
    review.product_code,
    review.name,
    review.description,
    review.stars
  );
}

export function findPagenatedReviews(id: string, fromReview: number, toReview: number) {
  const database = db();
  
  const offset = fromReview - 1;
  const limit = toReview - fromReview + 1;
  
  return database.prepare(`
    SELECT * FROM reviews 
    WHERE product_code = ? 
    ORDER BY created_at DESC, review_id DESC
    LIMIT ? OFFSET ?
  `).all(id, limit, offset);
}

export function findAllReviews(id: string) {
  const database = db();
  
  return database.prepare(`
    SELECT * FROM reviews 
    WHERE product_code = ? 
    ORDER BY review_id DESC
  `).all(id);
}

export function loadDumbShit() {
  const database = db();
  
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO products (code, codeType, name, description, image_url)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  // Sample product data
  const products = [
    {
      code: '5000112654042',
      codeType: 'UPC-A',
      name: 'Coca-Cola Classic',
      description: 'Original taste soft drink with sugar and sweeteners',
      image_url: 'https://www.coca-cola.com/content/dam/onexp/de/de/home-images/brands-images/fanta/fanta-desktop-v2.png'
    },
    {
      code: '5449000000996',
      codeType: 'UPC-A',
      name: 'Sprite',
      description: 'Lemon and lime flavoured soft drink with sugar and sweetener',
      image_url: 'https://www.coca-cola.com/content/dam/onexp/de/de/home-images/brands-images/fanta/fanta-desktop-v2.png'
    },
    {
      code: '5000112637236',
      codeType: 'UPC-A',
      name: 'Fanta Orange',
      description: 'Orange flavoured soft drink with sugar and sweeteners',
      image_url: 'https://www.coca-cola.com/content/dam/onexp/de/de/home-images/brands-images/fanta/fanta-desktop-v2.png'
    },
    {
      code: '5060335632302',
      codeType: 'UPC-A',
      name: 'Oatly Barista Edition',
      description: 'Oat drink specifically developed for coffee',
      image_url: 'https://www.coca-cola.com/content/dam/onexp/de/de/home-images/brands-images/fanta/fanta-desktop-v2.png'
    },
    {
      code: '5060517886554',
      codeType: 'UPC-A',
      name: 'Beyond Burger',
      description: 'Plant-based burger that looks and cooks like beef',
      image_url: 'https://example.com/images/beyond.jpg'
    },
    {
      code: '8410199074037',
      codeType: 'EAN-13',
      name: 'Pringles Original',
      description: 'Original flavour potato crisps',
      image_url: 'https://example.com/images/pringles.jpg'
    },
    {
      code: '5010477348678',
      codeType: 'UPC-A',
      name: 'Doritos Cool Original',
      description: 'Cool original flavour corn chips',
      image_url: 'https://example.com/images/doritos.jpg'
    },
    {
      code: '8001505005738',
      codeType: 'EAN-13',
      name: 'Nutella',
      description: 'Hazelnut spread with cocoa',
      image_url: 'https://example.com/images/nutella.jpg'
    },
    {
      code: '5000168189585',
      codeType: 'UPC-A',
      name: 'Heinz Tomato Ketchup',
      description: 'Classic tomato ketchup condiment',
      image_url: 'https://example.com/images/heinz.jpg'
    },
    {
      code: '3046920022651',
      codeType: 'EAN-13',
      name: 'Lindt Excellence 85% Cocoa',
      description: 'Dark chocolate with 85% cocoa content',
      image_url: 'https://example.com/images/lindt.jpg'
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