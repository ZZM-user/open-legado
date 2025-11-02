import {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {router, Stack} from 'expo-router';
import {BookOpen, RotateCcw} from 'lucide-react-native';
import {Input} from "tamagui";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import {BookSource, useBookSource} from "@/hooks/use-book-source";
import xpath from 'xpath';
import {DOMParser} from "xmldom";
import {JSONPath} from 'jsonpath-plus';
import {parseHTML} from "linkedom";

export interface RawSearchResult {
    title: string;
    author: string;
    coverUrl: string;
    intro: string;
    detailUrl: string;
}

export interface SearchResult extends RawSearchResult {
    id: string;
    sourceId: number;
    sourceName: string;
}

// 解析单个书源
const parseSearchResults = (
    htmlOrData: string,
    ruleGroups: any,
    source: BookSource
): RawSearchResult[] => {
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

        const results: RawSearchResult[] = [];

        if (itemType === 'css') {
            const {document} = parseHTML(htmlOrData);
            const items = Array.from(document.querySelectorAll(itemSelectorRule.value));
            items.forEach(item => {
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

                results.push({title, author, coverUrl, intro, detailUrl});
            });
        } else if (itemType === 'xpath') {
            // const {document} = parseHTML(htmlOrData);
            let document = new DOMParser().parseFromString(htmlOrData, 'text/html');
            const nodes = xpath.select(itemSelectorRule.value, document) as Node[];
            nodes.forEach(node => {
                const getText = (selector?: string) => {
                    if (!selector) return '';
                    const n = xpath.select(selector, node)[0] as Node | undefined;
                    return n?.textContent?.trim() ?? '';
                };

                const getAttr = (selector?: string, attr = 'src') => {
                    if (!selector) return '';
                    const n = xpath.select(selector, node)[0] as Element | undefined;
                    return n?.getAttribute?.(attr) ?? '';
                };

                const title = getText(titleSelector) || 'Unknown Title';
                const author = getText(authorSelector) || 'Unknown Author';
                let coverUrl = getAttr(coverSelector);
                let detailUrl = getAttr(detailSelector, 'href');
                const intro = getText(introSelector);

                if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
                else if (coverUrl.startsWith('/')) coverUrl = new URL(coverUrl, baseUrl).toString();
                if (detailUrl.startsWith('//')) detailUrl = 'https:' + detailUrl;
                else if (detailUrl.startsWith('/')) detailUrl = new URL(detailUrl, baseUrl).toString();

                results.push({title, author, coverUrl, intro, detailUrl});
            });
        } else if (itemType === 'jsonpath') {
            let data: any;
            try {
                data = JSON.parse(htmlOrData);
            } catch (e) {
                console.error('Invalid JSON for jsonpath parsing', e);
                return [];
            }
            const items = JSONPath({path: itemSelectorRule.value, json: data});
            items.forEach((item: any) => {
                const title = titleSelector ? item[titleSelector] || 'Unknown Title' : 'Unknown Title';
                const author = authorSelector ? item[authorSelector] || 'Unknown Author' : 'Unknown Author';
                let coverUrl = coverSelector ? item[coverSelector] || '' : '';
                let detailUrl = detailSelector ? item[detailSelector] || '' : '';
                const intro = introSelector ? item[introSelector] || '' : '';

                if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
                else if (coverUrl.startsWith('/')) coverUrl = new URL(coverUrl, baseUrl).toString();
                if (detailUrl.startsWith('//')) detailUrl = 'https:' + detailUrl;
                else if (detailUrl.startsWith('/')) detailUrl = new URL(detailUrl, baseUrl).toString();

                results.push({title, author, coverUrl, intro, detailUrl});
            });
        } else if (itemType === 'regex') {
            const itemRegex = new RegExp(itemSelectorRule.value, 'gi');
            const itemMatches = htmlOrData.match(itemRegex) || [];
            itemMatches.forEach(itemHtml => {
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

                results.push({title, author, coverUrl, intro, detailUrl});
            });
        }

        return results;
    } catch (e) {
        console.error('parseSearchResults error:', e);
        return [];
    }
};

// 主搜索函数
export const searchWithBookSources = async (
    query: string,
    sources: any[]
): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    const enabledSources = sources.filter((s: any) => s.enabled);

    const promises = enabledSources.map(async source => {
        try {
            let ruleGroups = source.ruleGroups;
            if (typeof ruleGroups === 'string') {
                ruleGroups = JSON.parse(ruleGroups);
            }
            const searchUrlRule = ruleGroups.search.find((r: any) => r.key === 'searchUrl');
            if (!searchUrlRule?.value) return [];

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
            if (!res.ok) return [];
            const htmlOrData = await res.text();

            const parsedResults = parseSearchResults(htmlOrData, ruleGroups, source);
            return parsedResults.map((r, i) => ({
                ...r,
                id: `${source.id}-${Date.now()}-${i}`,
                sourceId: source.id,
                sourceName: source.name
            }));
        } catch (e) {
            console.error(`Error fetching source ${source.name}:`, e);
            return [];
        }
    });

    const all = await Promise.all(promises);
    all.forEach(arr => results.push(...arr));
    return results;
};

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const {getAllSources} = useBookSource();

    const [sources, setSources] = useState(getAllSources() || []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const results = await searchWithBookSources(searchQuery, sources);
            const aggregatedResults = aggregateSearchResults(results);
            setSearchResults(aggregatedResults);
        } catch (err) {
            setError('搜索失败，请检查网络连接和书源配置');
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Enhanced aggregate results - remove duplicates based on title and author, but track multiple sources
    const aggregateSearchResults = (results: SearchResult[]): SearchResult[] => {
        const uniqueResultsMap = new Map<number, SearchResult & { allSourceIds: number[] }>();

        for (const result of results) {
            // Create a key using title and author to identify duplicates
            const key = Number(`${result.title.toLowerCase().trim()}-${result.author.toLowerCase().trim()}`);

            if (!uniqueResultsMap.has(key)) {
                // If we don't have a result with this key yet, add it with source tracking
                uniqueResultsMap.set(key, {
                    ...result,
                    allSourceIds: [result.sourceId]
                });
            } else {
                // If we already have a result with the same title and author,
                // add this source to the list of available sources for this book
                const existingResult = uniqueResultsMap.get(key)!;

                // Check if this source is already in the list to avoid duplicates
                if (!existingResult.allSourceIds.includes(result.sourceId)) {
                    existingResult.allSourceIds.push(result.sourceId);

                    // Optionally, if we want to preserve the best cover/image from all sources
                    // we could implement logic to choose the best cover here
                }
            }
        }

        // Convert back to SearchResult array
        return Array.from(uniqueResultsMap.values()).map(aggregateResult => {
            const {allSourceIds, ...searchResult} = aggregateResult;
            return searchResult;
        });
    };

    const handleResultPress = (result: SearchResult) => {
        // Navigate to book detail page
        router.push({
            pathname: '/book/book-detail',
            params: {
                id: result.id,
                title: result.title,
                author: result.author,
                coverUrl: result.coverUrl,
                intro: result.intro,
                sourceId: result.sourceId,
                sourceName: result.sourceName,
                detailUrl: result.detailUrl,
                allSourceIds: JSON.stringify(result.sourceId || [result.sourceId])
            }
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
                    <Input
                        style={styles.searchInput}
                        placeholder="搜索书籍..."
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
                                            来源: {item.sourceName}
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