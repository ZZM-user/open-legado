import {create} from 'zustand';
import {useBookStore} from "@/store/bookStore";
import {createParser} from "@/hooks/parsers/base/bookParserFactory";
import {generateCryptoKey} from "@/utils/cryptoUtil";
import {AsyncStorage} from "expo-sqlite/kv-store";

interface ReaderState {
    // UI 状态
    isMenuVisible: boolean;
    fontSize: number;
    theme: 'light' | 'dark';
    toggleMenu: () => void;
    setMenuVisible: (visible: boolean) => void;
    setFontSize: (size: number) => void;
    toggleTheme: () => void;

    // 数据状态
    content: string;
    isLoading: boolean;
    chapterTitle: string;
    scrollProgress: number;

    // 动作
    fetchChapterContent: () => Promise<void>;
    setContent: (content: string, title: string) => void;
}

interface ChapterCacheData {
    content: string;
    chapterTitle: string;
}

// 模拟的样式配置
export const themeColors = {
    light: {
        background: '#f5f5d5', // 经典的羊皮纸色
        text: '#333333',
        menuBg: '#ffffff',
        menuText: '#000000',
        statusBar: 'dark-content'
    },
    dark: {
        background: '#1a1a1a',
        text: '#b0b0b0',
        menuBg: '#2c2c2c',
        menuText: '#ffffff',
        statusBar: 'light-content'
    }
};

export const useReaderStore = create<ReaderState>((set, get) => ({
    isMenuVisible: false,
    fontSize: 18,
    theme: 'light',
    content: '',
    chapterTitle: '',
    isLoading: false,
    scrollProgress: 0,

    toggleMenu: () => set((state) => ({isMenuVisible: !state.isMenuVisible})),
    setMenuVisible: (visible) => set({isMenuVisible: visible}),
    setFontSize: (size) => set({fontSize: size}),
    toggleTheme: () => set((state) => ({theme: state.theme === 'light' ? 'dark' : 'light'})),

    setContent: (content, title) => set({content, chapterTitle: title}),

    fetchChapterContent: async () => {
        set({isLoading: true});
        try {
            // 1. 获取必要的 Store 状态
            const bookStore = useBookStore.getState();

            const cacheKey = await generateCryptoKey(
                [
                    bookStore.currentBook?.title,
                    bookStore.currentBook?.author,
                    bookStore.currentBook?.detailUrl,
                    bookStore.currentChapter?.title,
                    bookStore.currentChapter?.chapterUrl,
                    bookStore.currentSource?.id,
                    bookStore.currentSource?.name,
                ]
            )
            const cache = await AsyncStorage.getItem(cacheKey);
            console.log("cacheKey: ", cacheKey);
            console.log("cache: ", cache);
            if (cache) {
                const cachedData: ChapterCacheData = JSON.parse(cache);
                set({content: cachedData.content, chapterTitle: cachedData.chapterTitle, isLoading: false});
                return;
            }

            const currentBook = bookStore.currentBook;
            const currentSourceId = bookStore.bookOriginalSource?.id;

            if (!currentBook || !currentSourceId) throw new Error("No book or source");

            // 2. 获取 Source 对象
            const stableSource = bookStore.bookOriginalSource;

            // 3. 假设你知道当前的 URL (比如从 bookStore.currentChapterUrl 获取)
            const detailUrl = bookStore.currentChapter?.chapterUrl || bookStore.currentBook?.detailUrl || "";

            // 4. 调用你的 Parser
            let contentText = '';
            for await (const chunk of createParser(stableSource?.ruleType as any).getContent(detailUrl, stableSource as any)) {
                contentText += chunk;
            }

            const chapterTitle = bookStore.currentChapter?.title || "";
            set({
                content: contentText,
                chapterTitle: chapterTitle,
                isLoading: false
            });

            await AsyncStorage.setItem(cacheKey, JSON.stringify({content: contentText, chapterTitle: chapterTitle}));

        } catch (error) {
            console.error(error);
            set({isLoading: false, content: "加载失败"});
        }
    },
}));