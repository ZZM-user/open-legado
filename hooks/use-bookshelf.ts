import {useCallback, useEffect, useMemo, useState} from 'react';
import {db} from '@/db/drizzle';
import {eq} from 'drizzle-orm';
import {books as booksTable} from '@/db/schema';

export type Book = {
    id: number;
    title: string;
    author: string | null;
    coverUrl: string | null;
    progress: number | null;
    lastReadChapter: string | null;
    groupId: number | null;
    createdTime: number | null;
    updatedTime: number | null;
};

export type UseBookshelfOptions = {
    initialBooks?: Book[]; // 可选预加载
};

export type BookshelfActions = {
    addBook: (book: Book) => Promise<void>;
    removeBook: (bookId: number) => Promise<void>;
    clearBooks: () => Promise<void>;
    replaceBooks: (books: Book[]) => Promise<void>;
    upsertBook: (book: Book) => Promise<void>;
    getBookById: (bookId: number) => Book | null;
};

export type UseBookshelfResult = {
    books: Book[];
    totalBooks: number;
    hasBook: (bookId: number) => boolean;
} & BookshelfActions;

export function useBookshelf(options: UseBookshelfOptions = {}): UseBookshelfResult {
    const [books, setBooks] = useState<Book[]>(options.initialBooks ?? []);

    // 初始加载
    useEffect(() => {
        (async () => {
            const dbBooks = await db.select().from(booksTable);
            setBooks(dbBooks);
        })();
    }, []);

    // 是否存在
    const hasBook = useCallback((bookId: number) => books.some((b) => b.id === bookId), [books]);

    const totalBooks = useMemo(() => books.length, [books]);

    // 添加或更新
    const upsertBook = useCallback(async (book: Book) => {
        const exists = await db.select().from(booksTable).where(eq(booksTable.id, book.id)).get();

        if (exists) {
            await db.update(booksTable).set(book).where(eq(booksTable.id, book.id));
        } else {
            await db.insert(booksTable).values(book);
        }

        const dbBooks = await db.select().from(booksTable);
        setBooks(dbBooks);
    }, []);

    const addBook = useCallback(async (book: Book) => {
        await upsertBook(book);
    }, [upsertBook]);

    const removeBook = useCallback(async (bookId: number) => {
        await db.delete(booksTable).where(eq(booksTable.id, bookId));
        const dbBooks = await db.select().from(booksTable);
        setBooks(dbBooks);
    }, []);

    const clearBooks = useCallback(async () => {
        await db.delete(booksTable);
        setBooks([]);
    }, []);

    const replaceBooks = useCallback(async (nextBooks: Book[]) => {
        await db.delete(booksTable); // 清空
        if (nextBooks.length > 0) {
            await db.insert(booksTable).values(nextBooks);
        }
        setBooks(nextBooks);
    }, []);

    const getBookById = (bookId: number) => {
        return db.select().from(booksTable).where(eq(booksTable.id, bookId)).get();
    };

    return {
        books,
        totalBooks,
        hasBook,
        addBook,
        removeBook,
        clearBooks,
        replaceBooks,
        upsertBook,
        getBookById
    };
}
