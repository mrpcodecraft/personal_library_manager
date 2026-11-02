import { Book } from '../types/book';
import { SAMPLE_BOOKS } from '../constants/sampleBooks';

export interface BookStorage {
  getBooks(): Promise<Book[]>;
  saveBooks(books: Book[]): Promise<void>;
  addBook(book: Book): Promise<void>;
  updateBook(book: Book): Promise<void>;
  deleteBook(id: string): Promise<void>;
}

const STORAGE_KEY = '@library_books';

export class LocalBookStorage implements BookStorage {
  async getBooks(): Promise<Book[]> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Could not read from local storage', err);
      }
    }
    return SAMPLE_BOOKS;
  }

  async saveBooks(books: Book[]): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
      } catch (err) {
        console.warn('Could not write to local storage', err);
      }
    }
  }

  async addBook(book: Book): Promise<void> {
    const books = await this.getBooks();
    await this.saveBooks([book, ...books]);
  }

  async updateBook(book: Book): Promise<void> {
    const books = await this.getBooks();
    await this.saveBooks(books.map((b) => (b.id === book.id ? book : b)));
  }

  async deleteBook(id: string): Promise<void> {
    const books = await this.getBooks();
    await this.saveBooks(books.filter((b) => b.id !== id));
  }
}

export const bookStorage: BookStorage = new LocalBookStorage();
