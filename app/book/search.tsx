import {useState} from 'react';
import {ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {router, Stack} from 'expo-router';
import {BookOpen, RotateCcw} from 'lucide-react-native';
import ParallaxScrollView from "@/components/parallax-scroll-view";
import {useBookSource} from "@/hooks/use-book-source";
import {useBookStore} from "@/store/bookStore";
import {SearchResult} from "@/hooks/parsers/base/parser.types";
import {createParser} from "@/hooks/parsers/base/bookParserFactory";


// 主搜索函数
export async function* searchWithBookSources(
    query: string,
    sources: any[]
): AsyncGenerator<SearchResult> {
    const enabledSources = sources.filter((s: any) => s.enabled);

    for (const source of enabledSources) {
        try {
            for await (const result of createParser(source.ruleType).search(query, source)) {
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