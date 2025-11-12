import {useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ChapterItem} from "@/hooks/parsers/base/parser.types";

export const ChapterView = ({chapters = []}: { chapters?: ChapterItem[] }) => {
    const [modalVisible, setModalVisible] = useState(false);

    return <>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
            {/* 第一章节标题 */}
            <Text
                style={{flex: 1, fontSize: 14, color: '#333'}}
                numberOfLines={1}          // 超长省略
                ellipsizeMode="tail"
            >
                {chapters[0].title}
            </Text>

            {/* 查看全部目录按钮 */}
            {chapters.length > 1 && (
                <TouchableOpacity
                    style={{
                        marginLeft: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 4,
                    }}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={{color: '#007AFF', fontSize: 14}}>全部目录</Text>
                </TouchableOpacity>
            )}
        </View>

        <Modal
            visible={modalVisible}
            transparent={true}          // 背景透明
            animationType="fade"        // 或 'slide'
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>全部章节</Text>
                    <ScrollView contentContainerStyle={{paddingBottom: 20}}>
                        {chapters.map((chapter, index) => (
                            <TouchableOpacity
                                key={chapter.title + index}
                                style={styles.chapterItem}
                                onPress={() => {
                                    console.log('点击章节', chapter.title);
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.closeText}>关闭</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    </>
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',  // 半透明背景
        justifyContent: 'center',             // 居中弹窗
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',                        // 弹窗宽度
        maxHeight: '60%',                     // 弹窗高度
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: "auto"
    },
    chapterItem: {
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    chapterTitle: {
        fontSize: 16,
        color: '#333',
    },
    closeBtn: {
        marginTop: 10,
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#eee',
        borderRadius: 10,
    },
    closeText: {
        fontSize: 16,
        color: '#007AFF',
    },
});
