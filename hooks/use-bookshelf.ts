import {useCallback, useEffect, useMemo, useState} from 'react';
import {db} from '@/db/drizzle';
import {eq} from 'drizzle-orm';
import {Book, books as booksTable} from '@/db/schema';


export type UseBookshelfOptions = {
    initialBooks?: Book[]; // 可选预加载
};

export type BookshelfActions = {
    getBooks: () => Promise<Book[]>;
    addBook: (book: Book) => Promise<void>;
    removeBook: (bookId: string) => Promise<void>;
    clearBooks: () => Promise<void>;
    replaceBooks: (books: Book[]) => Promise<void>;
    upsertBook: (book: Book) => Promise<void>;
    getBookById: (bookId: string) => Promise<Book | null>;
};

export type UseBookshelfResult = {
    books: Book[];
    totalBooks: number;
    hasBook: (bookId: string) => boolean;
} & BookshelfActions;

export function useBookshelf(options: UseBookshelfOptions = {}): UseBookshelfResult {
    const [books, setBooks] = useState<Book[]>(options.initialBooks ?? []);
    const [isLoading, setIsLoading] = useState(true);

    // 1. 初始加载 (只在挂载时执行一次)
    useEffect(() => {
        let isMounted = true; // 用于处理组件卸载后的状态更新

        const loadInitialBooks = async () => {
            try {
                // 如果传入了 initialBooks，则跳过初始加载，但这里逻辑是覆盖初始值
                // 所以我们总是加载
                setIsLoading(true);
                const dbBooks = await getBooks();

                if (isMounted) {
                    setBooks(dbBooks);
                }
            } catch (error) {
                console.error("Failed to load books:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadInitialBooks();

        // 清理函数: 在组件卸载时将 isMounted 设为 false，防止内存泄漏
        return () => {
            isMounted = false;
        };
    }, []); // 仅在挂载时运行

    // 是否存在
    const hasBook = useCallback((bookId: string) => books.some((b) => b.id === bookId), [books]);

    const totalBooks = useMemo(() => books.length, [books]);

    // 获取全部
    const getBooks = useCallback(async () => {
        return db.select().from(booksTable);
    }, []);

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

    // 添加
    const addBook = useCallback(async (book: Book) => {
        await upsertBook(book);
    }, [upsertBook]);

    // 删除
    const removeBook = useCallback(async (bookId: string) => {
        await db.delete(booksTable).where(eq(booksTable.id, bookId));
        const dbBooks = await db.select().from(booksTable);
        setBooks(dbBooks);
    }, []);

    // 清空
    const clearBooks = useCallback(async () => {
        await db.delete(booksTable);
        setBooks([]);
    }, []);

    // 替换
    const replaceBooks = useCallback(async (nextBooks: Book[]) => {
        await db.delete(booksTable); // 清空
        if (nextBooks.length > 0) {
            await db.insert(booksTable).values(nextBooks);
        }
        setBooks(nextBooks);
    }, []);

    // 获取
    const getBookById = useCallback(async (bookId: string): Promise<Book | null> => {
        return db.select().from(booksTable).where(eq(booksTable.id, bookId)).get() || null;
    }, []);

    return {
        books,
        totalBooks,
        hasBook,
        getBooks,
        addBook,
        removeBook,
        clearBooks,
        replaceBooks,
        upsertBook,
        getBookById,
    };
}
