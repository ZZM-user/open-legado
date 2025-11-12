import {BookSource} from "@/hooks/use-book-source";

export interface BookSearchSource {
    id?: number;
    name: string;
    detailUrl: string;
}

export interface RawSearchResult {
    id?: string;
    title: string;
    author: string;
    coverUrl: string;
    intro: string;
    detailUrl: string;
}

export interface SearchResult extends RawSearchResult {
    bookSourceId?: number;
    bookSourceName: string;
    bookSearchSources: BookSearchSource[];
}

export interface ChapterItem {
    title: string;
    chapterUrl: string;
    isVIP?: boolean;
    updateTime?: string;
}

export interface ParserContext {
    headers?: Record<string, string>;
    cookies?: string;
    userAgent?: string;
}

export interface Searchable {
    search(htmlOrData: string, source: BookSource): AsyncGenerator<RawSearchResult>;
}

export interface ChapterListProvider {
    getChapters(bookDetailUrl: string, source: BookSource): AsyncGenerator<ChapterItem>;
}

export interface ContentProvider {
    getContent(chapterUrl: string, source: BookSource): AsyncGenerator<string>;
}

export interface BookParser extends Searchable, ChapterListProvider, ContentProvider {
    key: 'xpath' | 'css' | 'jsonpath' | 'regex';

    setContext?(context: ParserContext): void;

}

