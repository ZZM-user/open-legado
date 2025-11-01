import {FlatList, Image, StyleSheet, Text, View} from 'react-native';

// 定义书籍数据类型
type Book = {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    lastReadChapter?: string;
    progress?: number;
};

// 模拟书籍数据
const booksData: Book[] = [
    {
        id: '1',
        title: '斗破苍穹',
        author: '天蚕土豆',
        coverUrl: 'https://www.favddd.com/assets/images/book-image.jpg',
        lastReadChapter: '第125章',
        progress: 65,
    },
    {
        id: '2',
        title: '仙逆',
        author: '耳根',
        coverUrl: 'https://www.favddd.com/assets/images/book-image.jpg',
        lastReadChapter: '第312章',
        progress: 40,
    },
    {
        id: '3',
        title: '凡人修仙传',
        author: '忘语',
        coverUrl: 'https://www.favddd.com/assets/images/book-image.jpg',
        lastReadChapter: '第208章',
        progress: 80,
    },
];

export default function BookShelf() {
    // 渲染单个书籍项
    const renderBookItem = ({item}: { item: Book }) => (
        <View style={styles.bookItem}>
            <Image source={{uri: item.coverUrl}} style={styles.bookCover}/>
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                {item.lastReadChapter && (
                    <Text style={styles.lastRead}>上次读到: {item.lastReadChapter}</Text>
                )}
            </View>
        </View>
    );

    return (
        <FlatList
            data={booksData}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            style={styles.bookList}
            contentContainerStyle={styles.listContent}
        />
    );
}

const styles = StyleSheet.create({
    bookList: {
        flex: 1,
    },
    listContent: {},
    bookItem: {
        flexDirection: 'row',
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        alignItems: 'center',
        padding: 1,
    },
    bookCover: {
        width: 60,
        height: 80,
        borderRadius: 4,
        marginRight: 12,
    },
    bookInfo: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    lastRead: {
        fontSize: 12,
        color: '#aaa',
        marginBottom: 6,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    }
});
