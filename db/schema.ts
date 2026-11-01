/**
 * Database schema and DDL definitions for Library Manager.
 */

export const CREATE_BOOKS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY NOT NULL,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  actual_price REAL DEFAULT 0.0,
  paid_price REAL DEFAULT 0.0,
  book_type TEXT NOT NULL CHECK(book_type IN ('PHYSICAL', 'EBOOK')),
  language TEXT NOT NULL,
  cover_image_url TEXT,
  shelf_location TEXT,
  is_combination INTEGER DEFAULT 0,
  sub_books TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`.trim();

export const CREATE_INDEX_BOOKS_TITLE_SQL = `
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
`.trim();

export const CREATE_INDEX_BOOKS_ISBN_SQL = `
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
`.trim();

export const DATABASE_NAME = 'library_manager.db';
export const DATABASE_VERSION = 1;

