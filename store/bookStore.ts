// store/bookStore.ts
import {create} from 'zustand';
import {Book} from "@/hooks/use-bookshelf";
import {BookSearchSource, ChapterItem} from "@/hooks/parsers/base/parser.types";
import {BookSource} from "@/hooks/use-book-source";

interface BookStore {
    currentBook?: Book;
    currentSource?: BookSearchSource;
    currentSources?: BookSearchSource[];
    bookOriginalSource?: BookSource;
    currentChapter?: ChapterItem;
    setBook: (book: Book, currentSource: BookSearchSource, bookOriginalSource: BookSource, sources: BookSearchSource[]) => void;
    updateCurrentChapter: (chapter: ChapterItem) => void;
}

export const useBookStore = create<BookStore>((set) => ({
    setBook: (book, searchSource, bookOriginalSource, sources) => {
        set({
            currentBook: book,
            currentSource: searchSource,
            bookOriginalSource: bookOriginalSource,
            currentSources: sources
        })
    },
    updateCurrentChapter: (chapter: ChapterItem) => {
        set({
            currentChapter: chapter
        })
    }
}));
