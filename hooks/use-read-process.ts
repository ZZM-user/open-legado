import {useEffect, useState} from "react";
import {Book, BookReadingProcess, books, BookSources, bookSources, readingProgress} from "@/db/schema";
import {eq} from "drizzle-orm";
import {db} from "@/db/drizzle";


/**
 * 获取书籍 + 阅读进度的简单 Hook
 */
export function useReadingInfo(bookId?: string) {
    const [info, setInfo] = useState<null | {
        book: Book;
        source: BookSources;
        progress: BookReadingProcess;
    }>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);

    useEffect(() => {
        if (!bookId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1️⃣ 获取书籍
                const [book] = await db
                    .select()
                    .from(books)
                    .where(eq(books.id, bookId));

                if (!book) {
                    setInfo(null);
                    setError("书籍不存在");
                    return;
                }

                // 2️⃣ 获取书源
                const [source] = book.bookSourceId ? await db
                    .select()
                    .from(bookSources)
                    .where(eq(bookSources.id, book.bookSourceId)) : [];

                // 3️⃣ 获取阅读进度（只取最新的一条）
                const [progress] = await db
                    .select()
                    .from(readingProgress)
                    .where(eq(readingProgress.bookId, bookId))
                    .limit(1);

                setInfo({
                    book,
                    source,
                    progress,
                });
            } catch (err: any) {
                setError(err?.message || "未知错误");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [bookId]);

    return {
        info,
        loading,
        error,
    };
}
