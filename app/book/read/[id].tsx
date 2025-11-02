import React, {useState} from 'react';
import {Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {Book, useBookshelf} from '@/hooks/use-bookshelf';

const {width, height} = Dimensions.get('window');

export default function ReadScreen() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const {getBookById} = useBookshelf();
    const [book] = useState<Book | null>(getBookById(Number(id)) ?? null);

    const [showBars, setShowBars] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const [lineHeight, setLineHeight] = useState(24);
    const [chapterIndex, setChapterIndex] = useState(0);

    const chapters = [
        '这是第一章的内容……\n这是小说正文示例……',
        '这是第二章的内容……\n更多小说内容……',
        '这是第三章的内容……\n继续阅读……',
    ];

    if (!book) {
        return (
            <View style={styles.center}>
                <Text>未找到书籍</Text>
            </View>
        );
    }

    const toggleBars = () => setShowBars((prev) => !prev);

    const goNextChapter = () => {
        if (chapterIndex < chapters.length - 1) setChapterIndex(chapterIndex + 1);
    };
    const goPrevChapter = () => {
        if (chapterIndex > 0) setChapterIndex(chapterIndex - 1);
    };

    return (
        <View style={styles.container}>
            {/* 正文区 */}
            <TouchableOpacity style={styles.content} activeOpacity={1} onPress={toggleBars}>
                <ScrollView contentContainerStyle={{padding: 20}}>
                    <Text style={{fontSize, lineHeight}}>{chapters[chapterIndex]}</Text>
                </ScrollView>
            </TouchableOpacity>

            {/* 顶部操作栏 */}
            {showBars && (
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => console.log('返回')}>
                        <Text style={styles.barButton}>返回</Text>
                    </TouchableOpacity>
                    <Text style={styles.barTitle}>{book.title}</Text>
                    <TouchableOpacity onPress={() => console.log('换源')}>
                        <Text style={styles.barButton}>换源</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 底部操作栏 */}
            {showBars && (
                <View style={styles.bottomBar}>
                    <Text style={styles.progressText}>{`${chapterIndex + 1}/${chapters.length}`}</Text>

                    <View style={styles.bottomButtons}>
                        <TouchableOpacity onPress={goPrevChapter}>
                            <Text style={styles.barButton}>上一章</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => console.log('目录')}>
                            <Text style={styles.barButton}>目录</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => console.log('朗读')}>
                            <Text style={styles.barButton}>朗读</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowSettings(true)}>
                            <Text style={styles.barButton}>界面设置</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={goNextChapter}>
                            <Text style={styles.barButton}>下一章</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* 设置二级菜单 */}
            <Modal visible={showSettings} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>界面设置</Text>
                        <ScrollView>
                            <Text>字体大小: {fontSize}</Text>
                            <View style={styles.settingRow}>
                                <TouchableOpacity onPress={() => setFontSize((f) => f - 1)}>
                                    <Text style={styles.settingButton}>-</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setFontSize((f) => f + 1)}>
                                    <Text style={styles.settingButton}>+</Text>
                                </TouchableOpacity>
                            </View>

                            <Text>行高: {lineHeight}</Text>
                            <View style={styles.settingRow}>
                                <TouchableOpacity onPress={() => setLineHeight((h) => h - 2)}>
                                    <Text style={styles.settingButton}>-</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setLineHeight((h) => h + 2)}>
                                    <Text style={styles.settingButton}>+</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <Text style={styles.closeButton}>关闭设置</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    content: {flex: 1},
    topBar: {
        position: 'absolute',
        top: 0,
        width,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        width,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    barButton: {color: '#fff', fontSize: 16, marginHorizontal: 5},
    barTitle: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
    progressText: {color: '#fff', textAlign: 'center', marginBottom: 5},
    bottomButtons: {flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'},
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        maxHeight: height * 0.5,
    },
    modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
    settingRow: {flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10},
    settingButton: {fontSize: 24, paddingHorizontal: 15},
    closeButton: {color: 'blue', textAlign: 'center', marginTop: 20, fontSize: 16},
});
