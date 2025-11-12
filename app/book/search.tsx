import {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {router, Stack} from 'expo-router';
import {BookOpen, RotateCcw} from 'lucide-react-native';
import ParallaxScrollView from "@/components/parallax-scroll-view";
import {BookSource, useBookSource} from "@/hooks/use-book-source";
import xpath from 'xpath';
import {JSONPath} from 'jsonpath-plus';
import {DOMParser} from '@xmldom/xmldom';
import {useBookStore} from "@/store/bookStore";

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

// 解析单个书源
async function* parseSearchResults(
    htmlOrData: string,
    ruleGroups: any,
    source: BookSource
): AsyncGenerator<RawSearchResult> {
    try {
        const baseUrl = source.baseUrl;
        const searchRules = ruleGroups.search || [];
        const itemSelectorRule = searchRules.find((r: any) => r.key === 'itemSelector');
        const itemType = source.ruleType;
        if (!itemSelectorRule?.value) return [];

        const titleSelector = searchRules.find((r: any) => r.key === 'titleSelector')?.value;
        const authorSelector = searchRules.find((r: any) => r.key === 'authorSelector')?.value;
        const coverSelector = searchRules.find((r: any) => r.key === 'coverSelector')?.value;
        const introSelector = searchRules.find((r: any) => r.key === 'introSelector')?.value;
        const detailSelector = searchRules.find((r: any) => r.key === 'detailSelector')?.value;

        if (itemType === 'css') {
            // const {document} = parseHTML(htmlOrData);
            const parser = new DOMParser();
            const document = parser.parseFromString(htmlOrData, 'text/xml');
            const items = Array.from(document.querySelectorAll(itemSelectorRule.value));

            for (const item of items) {
                const query = (selector?: string) => selector ? item.querySelector(selector)?.textContent?.trim() || '' : '';
                const queryAttr = (selector?: string, attr = 'src') => {
                    if (!selector) return '';
                    const el = item.querySelector(selector);
                    return el ? el.getAttribute(attr) || '' : '';
                };

                const title = query(titleSelector) || 'Unknown Title';
                const author = query(authorSelector) || 'Unknown Author';
                let coverUrl = queryAttr(coverSelector);
                let detailUrl = queryAttr(detailSelector, 'href');
                const intro = query(introSelector);

                if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
                else if (coverUrl.startsWith('/')) coverUrl = new URL(coverUrl, baseUrl).toString();
                if (detailUrl.startsWith('//')) detailUrl = 'https:' + detailUrl;
                else if (detailUrl.startsWith('/')) detailUrl = new URL(detailUrl, baseUrl).toString();


                yield {title, author, coverUrl, intro, detailUrl};
            }
        } else if (itemType === 'xpath') {
            htmlOrData = htmlOrData
                // 1. 替换常见 HTML 实体
                .replace(/&nbsp;/g, ' ')
                .replace(/&copy;/g, '©')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                // 2. 移除或简化 DTD 声明（xmldom 严格性来源）
                // 替换 <!DOCTYPE ... > 为空字符串或简单的 <!DOCTYPE html>
                .replace(/<!DOCTYPE[^>]*>/i, '<!DOCTYPE html>')
            const document = new DOMParser({
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
            const nodes = xpath.select(itemSelectorRule.value, document) as Node[];
            for (const node of nodes) {
                // 1. 提取 Title (String value)
                // 强制断言结果为 string[]，并取第一个元素
                const title = extractStringValue(titleSelector, node, '');
                const author = extractStringValue(authorSelector, node, '')
                let coverUrl = extractStringValue(coverSelector, node, '')
                let detailUrl = extractStringValue(detailSelector, node, '')
                const intro = extractStringValue(introSelector, node, '')

                // URL 修复逻辑 (不变)
                if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
                else if (coverUrl.startsWith('/')) coverUrl = new URL(coverUrl, baseUrl).toString();
                if (detailUrl.startsWith('//')) detailUrl = 'https:' + detailUrl;
                else if (detailUrl.startsWith('/')) detailUrl = new URL(detailUrl, baseUrl).toString();

                yield {title, author, coverUrl, intro, detailUrl};
            }
        } else if (itemType === 'jsonpath') {
            let data: any;
            try {
                data = JSON.parse(htmlOrData);
            } catch (e) {
                console.error('Invalid JSON for jsonpath parsing', e);
                return [];
            }
            const items = JSONPath({path: itemSelectorRule.value, json: data});
            for (const item of items) {
                const title = titleSelector ? item[titleSelector] || 'Unknown Title' : 'Unknown Title';
                const author = authorSelector ? item[authorSelector] || 'Unknown Author' : 'Unknown Author';
                let coverUrl = coverSelector ? item[coverSelector] || '' : '';
                let detailUrl = detailSelector ? item[detailSelector] || '' : '';
                const intro = introSelector ? item[introSelector] || '' : '';

                if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
                else if (coverUrl.startsWith('/')) coverUrl = new URL(coverUrl, baseUrl).toString();
                if (detailUrl.startsWith('//')) detailUrl = 'https:' + detailUrl;
                else if (detailUrl.startsWith('/')) detailUrl = new URL(detailUrl, baseUrl).toString();

                yield {title, author, coverUrl, intro, detailUrl};
            }
        } else if (itemType === 'regex') {
            const itemRegex = new RegExp(itemSelectorRule.value, 'gi');
            const itemMatches = htmlOrData.match(itemRegex) || [];
            for (const itemHtml of itemMatches) {
                const extract = (selector?: string) => {
                    if (!selector) return '';
                    const match = itemHtml.match(new RegExp(selector, 'i'));
                    return match ? match[1] || match[0] : '';
                };
                let title = extract(titleSelector) || 'Unknown Title';
                let author = extract(authorSelector) || 'Unknown Author';
                let coverUrl = extract(coverSelector);
                let detailUrl = extract(detailSelector);
                const intro = extract(introSelector);

                if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
                else if (coverUrl.startsWith('/')) coverUrl = new URL(coverUrl, baseUrl).toString();
                if (detailUrl.startsWith('//')) detailUrl = 'https:' + detailUrl;
                else if (detailUrl.startsWith('/')) detailUrl = new URL(detailUrl, baseUrl).toString();

                yield {title, author, coverUrl, intro, detailUrl};
            }
        }
    } catch (e) {
        console.error('parseSearchResults error:', e);
        return [];
    }
};

const extractStringValue = (
    selector: string | undefined,
    contextNode: Node,
    defaultValue: string = ''
): string => {
    // 检查选择器是否存在
    if (!selector) {
        return defaultValue;
    }

    try {
        // 执行 XPath 选择，使用双重断言处理类型问题
        const results = xpath.select(`./${selector}`, contextNode) as unknown as string[];

        // 1. 检查结果是否为空数组
        if (!results || results.length === 0) {
            console.warn(`XPath extraction failed: No match found for selector: ${selector}`);
            return defaultValue; // 返回默认值
        }

        let rawValue: string | null = results[0];

        // 2. 检查结果类型：如果 XPath 选择了 text() 或 @attribute，结果可能是字符串或 Node。
        // 如果是 Node，需要提取其文本内容。
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

// 主搜索函数
export async function* searchWithBookSources(
    query: string,
    sources: any[]
): AsyncGenerator<SearchResult> {
    const enabledSources = sources.filter((s: any) => s.enabled);

    for (const source of enabledSources) {
        try {
            let ruleGroups = source.ruleGroups;
            if (typeof ruleGroups === 'string') {
                ruleGroups = JSON.parse(ruleGroups);
            }
            const searchUrlRule = ruleGroups.search.find((r: any) => r.key === 'searchUrl');
            if (!searchUrlRule?.value) return;

            let searchUrl = searchUrlRule.value.replace('{{key}}', encodeURIComponent(query));
            searchUrl = new URL(searchUrl, source.baseUrl).toString();

            let headers: Record<string, string> = {};
            const headersRule = ruleGroups.search.find((r: any) => r.key === 'headers');
            if (headersRule?.value) {
                try {
                    headers = JSON.parse(headersRule.value);
                } catch {
                }
            }

            const res = await fetch(searchUrl, {method: 'GET', headers});
            if (!res.ok) return;
            const htmlOrData = await res.text();

            for await (const result of parseSearchResults(htmlOrData, ruleGroups, source)) {
                yield {
                    ...result,
                    id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`,
                    bookSourceId: source.id,
                    bookSourceName: source.name,
                    bookSearchSources: []
                }
            }
        } catch (e) {
            console.error(`Error fetching source ${source.name}:`, e);
        }
    }
};

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const {getAllSources} = useBookSource();
    const bookStore = useBookStore.getState();

    const [sources, setSources] = useState(getAllSources() || []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const results = searchWithBookSources(searchQuery, sources);
            for await (const batch of results) {
                setSearchResults(prev => aggregateSearchResult(prev, batch));
            }
        } catch (err) {
            setError('搜索失败，请检查网络连接和书源配置');
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    /**
     * 聚合搜索结果。
     * 如果新结果与现有结果中某项的书名和作者相同，则合并其书源信息；
     * 否则将新结果添加到现有结果列表。
     *
     * @param results 现有的搜索结果列表。
     * @param result 刚解析出来的搜索结果。
     * @returns 聚合后的搜索结果列表。
     */
    const aggregateSearchResult = (
        results: SearchResult[],
        result: SearchResult
    ): SearchResult[] => {
        // 查找现有结果是否匹配
        const existingIndex = results.findIndex(item =>
            item.title === result.title && item.author === result.author
        );

        if (existingIndex !== -1) {
            // 复制原数组，避免直接修改
            const newResults = [...results];
            const existingResult = {...newResults[existingIndex]};

            // 合并书源
            const existingSources = existingResult.bookSearchSources || [];
            const newSources = result.bookSearchSources || [];

            const mergedSources = [
                ...existingSources,
                ...newSources.filter(newSource =>
                    !existingSources.some(source =>
                        source.detailUrl === newSource.detailUrl ||
                        (source.name === newSource.name && source.id === newSource.id)
                    )
                )
            ];

            existingResult.bookSearchSources = mergedSources;

            newResults[existingIndex] = existingResult;

            return newResults;
        } else {
            // 未找到匹配项，返回新数组
            return [...results, result];
        }
    };


    const handleResultPress = (result: SearchResult) => {
        bookStore.setBook(
            {
                id: result.id,
                title: result.title,
                author: result.author,
                coverUrl: result.coverUrl,
                intro: result.intro,
                sourceId: result.bookSourceId,
                sourceName: result.bookSourceName,
                detailUrl: result.detailUrl,
            },
            {
                id: result.bookSourceId,
                name: result.bookSourceName,
                detailUrl: result.detailUrl,
            },
            result.bookSearchSources,
        );
        router.push({
            pathname: '/book/book-detail',
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        handleSearch();
    };

    useEffect(() => {
        // Set up stack navigation options
        // Note: router.setOptions might not be available in all expo-router versions
        // The Stack.Screen component handles this in the render method instead
    }, []);

    return (
        <ParallaxScrollView
            showBackButton={true}
            headerElement={
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder={"输入书名称..."}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff"/>
                        ) : (
                            <Text style={styles.searchButtonText}>搜索</Text>
                        )}
                    </TouchableOpacity>
                </View>
            }>
            <Stack.Screen options={{headerShown: false}}/>
            <View style={styles.resultsContainer}>
                {searchResults.length > 0 ? (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleResultPress(item)}
                            >
                                <View style={styles.resultContent}>
                                    {item.coverUrl ? (
                                        <Image
                                            source={{uri: item.coverUrl}}
                                            style={styles.resultImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.resultImagePlaceholder}>
                                            <BookOpen size={32} color="#808080"/>
                                        </View>
                                    )}

                                    <View style={styles.resultInfo}>
                                        <Text style={styles.resultTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.resultAuthor} numberOfLines={1}>
                                            作者: {item.author}
                                        </Text>
                                        <Text style={styles.resultSource} numberOfLines={1}>
                                            来源: {item.bookSourceName}
                                        </Text>
                                        {item.intro && (
                                            <Text style={styles.resultIntro} numberOfLines={2}>
                                                {item.intro}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                        onRefresh={onRefresh}
                        refreshing={isRefreshing}
                    />
                ) : isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF"/>
                        <Text style={styles.loadingText}>搜索中...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
                            <RotateCcw size={16} color="#fff"/>
                            <Text style={styles.retryButtonText}>重试</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>搜索您的书籍</Text>
                        <Text style={styles.emptyDescription}>
                            输入书名或作者名开始搜索
                        </Text>
                    </View>
                )}
            </View>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    clearButton: {
        padding: 4,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultsContainer: {
        flex: 1,
        paddingTop: 8,
    },
    resultItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    resultContent: {
        flexDirection: 'row',
        gap: 12,
    },
    resultImage: {
        width: 60,
        height: 80,
        borderRadius: 4,
    },
    resultImagePlaceholder: {
        width: 60,
        height: 80,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    resultAuthor: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    resultSource: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    resultIntro: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 50,
    },
    errorText: {
        fontSize: 16,
        color: '#ff3b30',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});