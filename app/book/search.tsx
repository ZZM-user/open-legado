import {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {router, Stack} from 'expo-router';
import {BookOpen, RotateCcw} from 'lucide-react-native';
import {Input} from "tamagui";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import {useBookSource} from "@/hooks/use-book-source";

// Define search result type
export type SearchResult = {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    intro?: string;
    sourceId: string;
    sourceName: string;
    detailUrl?: string;
    allSourceIds?: string[]; // Additional field to track all sources that have this book
};

// Define actual search result from source
export type RawSearchResult = {
    title: string;
    author: string;
    coverUrl?: string;
    intro?: string;
    detailUrl?: string;
};

// Search service to handle book source search
export const searchWithBookSources = async (
    query: string,
    sources: any[]
): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];

    // Filter enabled sources
    const enabledSources = sources.filter((source: any) => source.enabled);

    // Parallel search across all enabled sources
    const searchPromises = enabledSources.map(async (source) => {
        try {
            // Extract search URL template from source rules
            const searchRules = source.ruleGroups.search;
            const searchUrlRule = searchRules.find((rule: any) => rule.key === 'searchUrl');
            const searchUrlTemplate = searchUrlRule?.value || '';

            if (!searchUrlTemplate) {
                console.warn(`No search URL configured for source: ${source.name}`);
                return [];
            }

            // Replace placeholder with actual search query
            const searchUrl = searchUrlTemplate.replace('{{key}}', encodeURIComponent(query));

            // Add base URL if search URL is relative
            let fullSearchUrl = searchUrl;
            if (searchUrl.startsWith('/')) {
                fullSearchUrl = new URL(searchUrl, source.baseUrl).toString();
            } else if (!searchUrl.startsWith('http')) {
                fullSearchUrl = source.baseUrl + searchUrl;
            }

            // Prepare headers from source configuration
            const headersRule = searchRules.find((rule: any) => rule.key === 'headers');
            const headers = headersRule?.value ? JSON.parse(headersRule.value) : {};

            // Make the actual HTTP request
            const response = await fetch(fullSearchUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; OpenLegado)',
                    ...headers
                }
            });

            if (!response.ok) {
                console.error(`Failed to search with source: ${source.name}`, response.status);
                return [];
            }

            const html = await response.text();

            // Parse search results based on source configuration
            const parsedResults = parseSearchResults(html, searchRules, source.baseUrl);

            // Map to our SearchResult format with source info
            return parsedResults.map((rawResult: RawSearchResult, index: number) => ({
                id: `${source.id}-${Date.now()}-${index}`,
                title: rawResult.title,
                author: rawResult.author,
                coverUrl: rawResult.coverUrl,
                intro: rawResult.intro,
                sourceId: source.id,
                sourceName: source.name,
                detailUrl: rawResult.detailUrl
            }));
        } catch (error) {
            console.error(`Error searching with source ${source.name}:`, error);
            return [];
        }
    });

    // Wait for all source searches to complete
    const allResults = await Promise.all(searchPromises);

    // Flatten results from all sources
    allResults.forEach(sourceResults => {
        results.push(...sourceResults);
    });

    return results;
};

// Parse search results based on source rules (simplified version)
const parseSearchResults = (
    html: string,
    searchRules: any[],
    baseUrl: string
): RawSearchResult[] => {
    try {
        // For now, using regex-based parsing as we don't have a full DOM parser in React Native
        // In a real app, you would want to implement a proper HTML/XML parser
        const itemSelectorRule = searchRules.find((rule: any) => rule.key === 'itemSelector');
        const titleSelectorRule = searchRules.find((rule: any) => rule.key === 'titleSelector');
        const authorSelectorRule = searchRules.find((rule: any) => rule.key === 'authorSelector');
        const coverSelectorRule = searchRules.find((rule: any) => rule.key === 'coverSelector');
        const introSelectorRule = searchRules.find((rule: any) => rule.key === 'introSelector');
        const detailSelectorRule = searchRules.find((rule: any) => rule.key === 'detailSelector');

        if (!itemSelectorRule || !itemSelectorRule.value) {
            return [];
        }

        // Simple regex-based parsing (this is a simplified example)
        // In a real implementation, you'd use a proper HTML parser
        const itemSelector = itemSelectorRule.value;

        // Extract item elements using simple regex (this is limited, but works for basic cases)
        // Note: Real implementation would need a proper HTML parser
        const itemRegex = new RegExp(`<div[^>]*class=["'][^"']*${itemSelector.replace('.', '')}[^"']*["'][^>]*>.*?</div>`, 'gi');
        const itemMatches = html.match(itemRegex) || [];

        const results: RawSearchResult[] = [];

        for (const itemHtml of itemMatches) {
            // Extract title
            let title = '';
            if (titleSelectorRule && titleSelectorRule.value) {
                const titleRegex = new RegExp(titleSelectorRule.value.replace('.', '\\.'));
                const titleMatch = itemHtml.match(titleRegex);
                title = titleMatch ? titleMatch[1] || titleMatch[0] : 'Unknown Title';
            }

            // Extract author
            let author = '';
            if (authorSelectorRule && authorSelectorRule.value) {
                const authorRegex = new RegExp(authorSelectorRule.value.replace('.', '\\.'));
                const authorMatch = itemHtml.match(authorRegex);
                author = authorMatch ? authorMatch[1] || authorMatch[0] : 'Unknown Author';
            }

            // Extract cover
            let coverUrl = '';
            if (coverSelectorRule && coverSelectorRule.value) {
                const coverRegex = new RegExp(coverSelectorRule.value.replace('.', '\\.'));
                const coverMatch = itemHtml.match(coverRegex);
                if (coverMatch) {
                    coverUrl = coverMatch[1] || coverMatch[0];
                    // Resolve relative URLs
                    if (coverUrl.startsWith('//')) {
                        coverUrl = 'https:' + coverUrl;
                    } else if (coverUrl.startsWith('/')) {
                        coverUrl = new URL(coverUrl, baseUrl).toString();
                    }
                }
            }

            // Extract intro
            let intro = '';
            if (introSelectorRule && introSelectorRule.value) {
                const introRegex = new RegExp(introSelectorRule.value.replace('.', '\\.'));
                const introMatch = itemHtml.match(introRegex);
                intro = introMatch ? introMatch[1] || introMatch[0] : '';
            }

            // Extract detail URL
            let detailUrl = '';
            if (detailSelectorRule && detailSelectorRule.value) {
                const detailRegex = new RegExp(detailSelectorRule.value.replace('.', '\\.'));
                const detailMatch = itemHtml.match(detailRegex);
                if (detailMatch) {
                    detailUrl = detailMatch[1] || detailMatch[0];
                    // Resolve relative URLs
                    if (detailUrl.startsWith('//')) {
                        detailUrl = 'https:' + detailUrl;
                    } else if (detailUrl.startsWith('/')) {
                        detailUrl = new URL(detailUrl, baseUrl).toString();
                    }
                }
            }

            if (title) {
                results.push({
                    title: title,
                    author: author,
                    coverUrl: coverUrl,
                    intro: intro,
                    detailUrl: detailUrl
                });
            }
        }

        return results;
    } catch (error) {
        console.error('Error parsing search results:', error);
        return [];
    }
};

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {sources} = useBookSource();

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
        const uniqueResultsMap = new Map<string, SearchResult & { allSourceIds: string[] }>();

        for (const result of results) {
            // Create a key using title and author to identify duplicates
            const key = `${result.title.toLowerCase().trim()}-${result.author.toLowerCase().trim()}`;

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
                bookId: result.id,
                title: result.title,
                author: result.author,
                coverUrl: result.coverUrl,
                intro: result.intro,
                sourceId: result.sourceId,
                sourceName: result.sourceName,
                detailUrl: result.detailUrl,
                allSourceIds: JSON.stringify(result.allSourceIds || [result.sourceId])
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