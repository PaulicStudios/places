import Database from 'better-sqlite3';

const dbPath = process.env.PATH_TO_DB;

// Singleton pattern - only create one database connection
let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (!_db) {
    _db = new Database(dbPath);
    
    _db.exec(`
      CREATE TABLE IF NOT EXISTS products(
        code TEXT NOT NULL,
        codeType TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL
      );
    `);
  }
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
    INSERT INTO products (code, codeType, name, description, image_url)
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
