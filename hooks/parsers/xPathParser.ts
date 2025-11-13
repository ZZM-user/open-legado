import {BookParser, ChapterItem, ParserContext, RawSearchResult} from "@/hooks/parsers/base/parser.types";
import {BookSource, BookSourceRule} from "@/hooks/use-book-source";
import {DOMParser} from "@xmldom/xmldom";
import xpath from "xpath";
import {ParseBookUtil} from "@/hooks/parsers/util/request";

export class XPathParser implements BookParser {

    key = 'xpath' as const;

    setContext?(context: ParserContext): void {
        throw new Error("Method not implemented.");
    }

    async* search(
        query: string,
        source: BookSource
    ): AsyncGenerator<RawSearchResult> {
        try {
            const baseUrl = source.baseUrl;
            const searchRules = source.ruleGroups.search || [];
            const itemSelectorRule = searchRules.find((r: any) => r.key === 'itemSelector');
            const itemType = source.ruleType;
            if (!itemSelectorRule?.value) return [];

            const titleSelector = searchRules.find((r: any) => r.key === 'titleSelector')?.value;
            const authorSelector = searchRules.find((r: any) => r.key === 'authorSelector')?.value;
            const coverSelector = searchRules.find((r: any) => r.key === 'coverSelector')?.value;
            const introSelector = searchRules.find((r: any) => r.key === 'introSelector')?.value;
            const detailSelector = searchRules.find((r: any) => r.key === 'detailSelector')?.value;

            // 获取搜索 URL
            const searchUrlRule = searchRules.find(r => r.key === 'searchUrl');
            if (!searchUrlRule?.value) return;

            let searchUrl = searchUrlRule.value.replace('{{key}}', encodeURIComponent(query));
            searchUrl = new URL(searchUrl, source.baseUrl).toString();

            const document = await this.getHtmlData(searchUrl, searchRules);
            const nodes = xpath.select(itemSelectorRule.value, document) as Node[];
            for (const node of nodes) {
                // 1. 提取 Title (String value)
                // 强制断言结果为 string[]，并取第一个元素
                const title = this.extractValue(titleSelector, node, '');
                const author = this.extractValue(authorSelector, node, '')
                let coverUrl = this.extractValue(coverSelector, node, '')
                let detailUrl = this.extractValue(detailSelector, node, '')
                const intro = this.extractValue(introSelector, node, '')

                // URL 修复逻辑 (不变)
                if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
                else if (coverUrl.startsWith('/')) coverUrl = new URL(coverUrl, baseUrl).toString();
                if (detailUrl.startsWith('//')) detailUrl = 'https:' + detailUrl;
                else if (detailUrl.startsWith('/')) detailUrl = new URL(detailUrl, baseUrl).toString();

                yield {title, author, coverUrl, intro, detailUrl};
            }
        } catch (e) {
            console.error('parseSearchResults error:', e);
            return [];
        }
    };

    async* getChapters(bookDetailUrl: string, source: BookSource): AsyncGenerator<ChapterItem> {
        console.log(`getChapters: ${bookDetailUrl}`);
        // {key: 'chapterTitle', label: '章节标题规则', placeholder: 'a'},
        // {key: 'chapterUrl', label: '章节链接规则', placeholder: 'a::attr(href)'},
        const chapterListSelector = source.ruleGroups.catalog.find((r: any) => r.key === 'chapterList');
        if (!chapterListSelector?.value) return [];
        const chapterTitleSelector = source.ruleGroups.catalog.find((r: any) => r.key === 'chapterTitle');
        if (!chapterTitleSelector?.value) return [];
        const chapterUrlSelector = source.ruleGroups.catalog.find((r: any) => r.key === 'chapterUrl');
        if (!chapterUrlSelector?.value) return [];

        const document = await this.getHtmlData(bookDetailUrl, source.ruleGroups.catalog);

        const nodes = xpath.select(chapterListSelector.value, document) as Node[];
        for (const node of nodes) {
            const title = this.extractValue(chapterTitleSelector.value, node, '');
            let chapterUrl = this.extractValue(chapterUrlSelector.value, node, '');
            if (chapterUrl.startsWith('/')) {
                chapterUrl = new URL(chapterUrl, bookDetailUrl).toString();
            }
            console.log(`${bookDetailUrl}:${title}- ${chapterUrl}`);
            yield {title, chapterUrl};
        }
    }

    async* getContent(chapterUrl: string, source: BookSource): AsyncGenerator<string> {
        console.log(`getContent ${chapterUrl}`);
        const contentSelector = source.ruleGroups.content.find((r: any) => r.key === 'content');
        if (!contentSelector?.value) return [];

        const document = await this.getHtmlData(chapterUrl, source.ruleGroups.content);
        yield this.extractContent(contentSelector.value, document, '');
    }

    async getHtmlData(url: string, rule: BookSourceRule[]) {
        let htmlOrData = await ParseBookUtil.getHtml(url, rule);
        htmlOrData = htmlOrData
            // 1. 替换常见 HTML 实体
            .replace(/&nbsp;/g, ' ')
            .replace(/&copy;/g, '©')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/<!DOCTYPE[^>]*>/i, '<!DOCTYPE html>');

        return new DOMParser({
            locator: {},
            errorHandler: {
                warning: function (w) {
                },
                error: function (e) {
                },
                fatalError: function (e) {
                    console.error(e)
                }
            }
        }).parseFromString(htmlOrData);
    }

    extractValue = (
        selector: string | undefined,
        contextNode: Node,
        defaultValue: string = '',
        fullSelector: boolean = false
    ): string => {
        // 检查选择器是否存在
        if (!selector) {
            return defaultValue;
        }

        try {
            // 执行 XPath 选择，使用双重断言处理类型问题
            if (!fullSelector) {
                selector = `./${selector}`
            }
            const results = xpath.select(selector, contextNode) as unknown as string[];

            // 1. 检查结果是否为空数组
            if (!results || results.length === 0) {
                console.warn(`XPath extraction failed: No match found for selector: ${selector}`);
                return defaultValue; // 返回默认值
            }

            let rawValue: string | null = results[0];

            if (typeof rawValue === 'object' && rawValue !== null && 'textContent' in rawValue) {
                // 假设它是一个 Node 对象
                rawValue = (rawValue as Node).textContent;
            }
            // 如果结果是 number 或其他非字符串类型，可能需要进一步处理，但通常 XPath 提取字符串值不会是纯数字。

            // 3. 确保结果是字符串，然后 trim。
            if (typeof rawValue === 'string') {
                return rawValue.trim();
            }

            // 4. 处理非字符串但存在的值（可能是 null/undefined，但经过前两步应该排除了）
            console.warn(`XPath extraction failed: Result is not a string for selector: ${selector}`);
            return defaultValue;

        } catch (error) {
            // 如果 XPath 表达式本身有问题，或者解析失败，返回默认值
            console.warn(`XPath extraction failed for selector: ${selector}`, error);
            return defaultValue;
        }
    };

    extractContent = (
        selector: string | undefined,
        contextNode: Node,
        defaultValue: string = ''
    ): string => {
        if (!selector) return defaultValue;

        try {
            const results = xpath.select(selector, contextNode) as Node[];

            if (!results || results.length === 0) {
                console.warn(`XPath extraction failed: No match found for selector: ${selector}`);
                return defaultValue;
            }

            const texts = results
                .map(p => p.textContent?.trim())
                .filter(Boolean);

            return texts.join('\n\n'); // 保留段落结构
        } catch (error) {
            console.warn(`XPath extraction failed for selector: ${selector}`, error);
            return defaultValue;
        }
    };


}