export type BookType = 'PHYSICAL' | 'EBOOK';

export interface SubBook {
  subBookNumber: number;
  name: string;
  title: string;
  author: string;
}

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  actualPrice: number;
  paidPrice: number;
  bookType: BookType;
  language: string;
  coverImageUrl?: string;
  isCombination: boolean;
  subBooks: SubBook[];
  shelfLocation?: string;
  createdAt: string;
  updatedAt: string;
}

