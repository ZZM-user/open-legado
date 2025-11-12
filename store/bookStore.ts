// store/bookStore.ts
import {create} from 'zustand';
import {Book} from "@/hooks/use-bookshelf";
import {BookSearchSource} from "@/app/book/search";

interface BookStore {
    currentBook?: Book;
    currentSource?: BookSearchSource;
    currentSources?: BookSearchSource[];
    setBook: (book: Book, currentSource: BookSearchSource, sources: BookSearchSource[]) => void;
}

export const useBookStore = create<BookStore>((set) => ({
    setBook: (book, cSource, sources) => set({currentBook: book, currentSource: cSource, currentSources: sources}),
}));
