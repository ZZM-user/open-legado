import React from 'react';
import {Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import {Book, useBookshelf} from '@/hooks/use-bookshelf';

const {width} = Dimensions.get('window');

export type BookDetailProps = {
    book: Book;
};

export default function BookDetailScreen({book}: BookDetailProps) {
    const router = useRouter();
    const {addBook, hasBook} = useBookshelf();

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
                    <Image source={{uri: book.coverUrl ?? ''}} style={styles.cover}/>
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
                    <Text style={styles.sectionContent}>默认书源：示例小说网</Text>
                    <Text style={styles.sectionContent}>其他书源：书源A / 书源B</Text>
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
    container: {flex: 1, backgroundColor: '#fff'},
    content: {paddingBottom: 80, paddingHorizontal: 15, paddingTop: 15},
    header: {flexDirection: 'row', marginBottom: 20},
    cover: {width: 100, height: 140, borderRadius: 5, marginRight: 15},
    info: {flex: 1, justifyContent: 'space-between'},
    title: {fontSize: 20, fontWeight: 'bold', marginBottom: 5},
    author: {fontSize: 14, color: '#666'},
    progress: {fontSize: 14, color: '#999'},
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
    },
    bottomButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomButtonText: {fontSize: 16, color: '#333'},
    readButton: {
        backgroundColor: '#007aff',
    },
});
