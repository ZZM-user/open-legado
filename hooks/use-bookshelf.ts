import { useCallback, useMemo, useState } from 'react';

export type Book = {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    lastReadChapter?: string;
    progress?: number;
};

const defaultBooks: Book[] = [
    {
        id: '1',
        title: '斗破苍穹',
        author: '天蚕土豆',
        coverUrl: 'https://www.favddd.com/assets/images/book-image.jpg',
        lastReadChapter: '第125章',
        progress: 65,
    },
    {
        id: '2',
        title: '仙逆',
        author: '耳根',
        coverUrl: 'https://www.favddd.com/assets/images/book-image.jpg',
        lastReadChapter: '第312章',
        progress: 40,
    },
    {
        id: '3',
        title: '凡人修仙传',
        author: '忘语',
        coverUrl: 'https://www.favddd.com/assets/images/book-image.jpg',
        lastReadChapter: '第208章',
        progress: 80,
    },
];

export type UseBookshelfOptions = {
    initialBooks?: Book[];
};

export type BookshelfActions = {
    addBook: (book: Book) => void;
    removeBook: (bookId: string) => void;
    clearBooks: () => void;
    replaceBooks: (books: Book[]) => void;
    upsertBook: (book: Book) => void;
};

export type UseBookshelfResult = {
    books: Book[];
    totalBooks: number;
    hasBook: (bookId: string) => boolean;
} & BookshelfActions;

export function useBookshelf(options: UseBookshelfOptions = {}): UseBookshelfResult {
    const [books, setBooks] = useState<Book[]>(options.initialBooks ?? defaultBooks);

    const upsertBook = useCallback((book: Book) => {
        setBooks((prev) => {
            const index = prev.findIndex((item) => item.id === book.id);
            if (index === -1) {
                return [book, ...prev];
            }

            const cloned = [...prev];
            cloned[index] = { ...cloned[index], ...book };
            return cloned;
        });
    }, []);

    const addBook = useCallback((book: Book) => {
        upsertBook(book);
    }, [upsertBook]);

    const removeBook = useCallback((bookId: string) => {
        setBooks((prev) => prev.filter((item) => item.id !== bookId));
    }, []);

    const clearBooks = useCallback(() => {
        setBooks([]);
    }, []);

    const replaceBooks = useCallback((nextBooks: Book[]) => {
        setBooks(nextBooks);
    }, []);

    const hasBook = useCallback((bookId: string) => books.some((item) => item.id === bookId), [books]);

    const totalBooks = useMemo(() => books.length, [books]);

    return {
        books,
        totalBooks,
        addBook,
        upsertBook,
        removeBook,
        clearBooks,
        replaceBooks,
        hasBook,
    };
}

export const BookshelfDefaults = Object.freeze(defaultBooks);

