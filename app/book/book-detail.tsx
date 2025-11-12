import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import {Book, useBookshelf} from '@/hooks/use-bookshelf';
import {useBookStore} from "@/store/bookStore";
import {BookOpen} from "lucide-react-native";
import {createParser} from "@/hooks/parsers/base/bookParserFactory";
import {useBookSource} from "@/hooks/use-book-source";
import {ChapterItem} from "@/hooks/parsers/base/parser.types";
import {ChapterView} from "@/components/chapter-view";

const {width} = Dimensions.get('window');

export default function BookDetailScreen() {
    const router = useRouter();
    const bookStore = useBookStore.getState();
    const book = bookStore.currentBook as Book;
    const bookSource = useBookSource();
    const currentBookSource = bookSource.getSourceById(bookStore.currentSource?.id);
    const {addBook, hasBook} = useBookshelf();
    const [chapters, setChapters] = useState<ChapterItem[]>([]);

    const detailUrl = bookStore.currentBook?.detailUrl;
    const stableSource = useMemo(() => currentBookSource, [currentBookSource?.id]);

    useEffect(() => {
        if (!stableSource || !detailUrl) return;
        let cancelled = false;

        const loadChapters = async () => {
            const chapters: ChapterItem[] = [];
            const gen = createParser(stableSource.ruleType as any).getChapters(detailUrl, stableSource as any);
            for await (const ch of gen) {
                if (cancelled) break;
                chapters.push(ch);
            }
            if (!cancelled) setChapters(chapters);
        };

        loadChapters();

        return () => {
            cancelled = true
        };
    }, [stableSource, detailUrl]);


    if (!book) {
        return <Text>未选择书籍</Text>;
    }

    const handleAddToBookshelf = async () => {
        if (hasBook(book.id)) {
            Alert.alert('提示', '书籍已在书架中');
        } else {
            await addBook(book);
            Alert.alert('成功', '已添加到书架');
        }
    };

    const handleReadNow = () => {
        router.push({
            pathname: '/book/read/[id]',
            params: {id: book.id}
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* 封面 + 基本信息 */}
                <View style={styles.header}>
                    {book.coverUrl ? (
                        <Image
                            source={{uri: book.coverUrl}}
                            style={styles.cover}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.resultImagePlaceholder}>
                            <BookOpen size={32} color="#808080"/>
                        </View>
                    )}
                    <View style={styles.info}>
                        <Text style={styles.title}>{book.title}</Text>
                        <Text style={styles.author}>{book.author ?? '未知作者'}</Text>
                        <Text style={styles.progress}>
                            阅读进度: {book.progress ?? 0}%
                        </Text>
                    </View>
                </View>

                {/* 简介 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>简介</Text>
                    <Text style={styles.sectionContent}>
                        {book.lastReadChapter
                            ? `上次阅读章节：${book.lastReadChapter}`
                            : '暂无简介'}
                    </Text>
                </View>

                {/* 书源信息 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>书源信息</Text>
                    <Text style={styles.sectionContent}>来源：{bookStore.currentSource?.name}</Text>
                    <Text
                        style={styles.sectionContent}>其他书源：{bookStore.currentSources?.map(item => item.name).join('、')}</Text>
                </View>

                {/* 目录信息 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>目录</Text>
                    <ChapterView chapters={chapters}/>
                </View>
            </ScrollView>

            {/* 底部操作栏 */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.bottomButton} onPress={handleAddToBookshelf}>
                    <Text style={styles.bottomButtonText}>加入书架</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bottomButton, styles.readButton]} onPress={handleReadNow}>
                    <Text style={[styles.bottomButtonText, {color: '#fff'}]}>立即阅读</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff', paddingTop: 60},
    content: {paddingBottom: 80, paddingHorizontal: 15, paddingTop: 15},
    header: {flexDirection: 'row', marginBottom: 20},
    cover: {width: 100, height: 140, borderRadius: 10, marginRight: 15},
    resultImagePlaceholder: {
        width: 100,
        height: 140,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    info: {flex: 1, justifyContent: 'space-between'},
    title: {fontSize: 20, fontWeight: 'bold', marginBottom: 5},
    author: {fontSize: 14, color: '#666'},
    progress: {fontSize: 14, color: '#999'},
    chapterList: {
        flexDirection: 'column',
    },
    chapterItem: {
        height: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    chapterTitle: {
        color: '#333',
        fontSize: 14,
    },
    section: {marginBottom: 15},
    sectionTitle: {fontSize: 16, fontWeight: 'bold', marginBottom: 5},
    sectionContent: {fontSize: 14, color: '#444', lineHeight: 20},
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        width: width,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        paddingVertical: 10,
        margin: 20,
        paddingTop: 20,
        marginBottom: 30
    },
    bottomButton: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderStyle: 'solid',
        borderRadius: 10,
        marginRight: 40,
        backgroundColor: '#f0f0f0',
    },
    bottomButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 10,
        color: '#333'
    },
    readButton: {
        backgroundColor: '#007aff',
    },
});
