import { Book } from '../types/book';

export interface BookStorage {
  getBooks(): Promise<Book[]>;
  saveBooks(books: Book[]): Promise<void>;
  addBook(book: Book): Promise<void>;
  updateBook(book: Book): Promise<void>;
  deleteBook(id: string): Promise<void>;
}
