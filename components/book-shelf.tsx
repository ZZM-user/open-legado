import {Book, useBookshelf} from '@/hooks/use-bookshelf';
import {forwardRef, useImperativeHandle} from 'react';
import {FlatList, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {BookOpen} from "lucide-react-native";

export type BookShelfHandle = {
    addBook: (book: Book) => void;
    removeBook: (bookId: string) => void;
    upsertBook: (book: Book) => void;
    clearBooks: () => void;
    replaceBooks: (books: Book[]) => void;
    hasBook: (bookId: string) => boolean;
    getBooks: () => Book[];
};

export type BookShelfProps = {
    initialBooks?: Book[];
    onBookPress?: (book: Book) => void;
};

const BookShelf = forwardRef<BookShelfHandle, BookShelfProps>(function BookShelf(
    {initialBooks, onBookPress},
    ref,
) {
    const {books, addBook, upsertBook, removeBook, clearBooks, replaceBooks, hasBook} = useBookshelf({initialBooks});

    useImperativeHandle(
        ref,
        () => ({
            addBook,
            upsertBook,
            removeBook,
            clearBooks,
            replaceBooks,
            hasBook,
        }),
        [addBook, upsertBook, removeBook, clearBooks, replaceBooks, hasBook],
    );

    const renderBookItem = ({item}: { item: Book }) => (
        <TouchableOpacity onPress={() => onBookPress?.(item)} activeOpacity={0.7}>
            <View style={styles.bookItem}>
                {item.coverUrl ? (
                    <Image
                        source={{uri: item.coverUrl}}
                        style={styles.bookCover}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.resultImagePlaceholder}>
                        <BookOpen size={32} color="#808080"/>
                    </View>
                )}
                <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{item.title}</Text>
                    <Text style={styles.bookAuthor}>{item.author}</Text>
                    {item.lastReadChapter && (
                        <Text style={styles.lastRead}>上次读到: {item.lastReadChapter}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={books}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            style={styles.bookList}
            contentContainerStyle={books.length === 0 ? styles.emptyContent : styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>书架空空如也</Text>
                    <Text style={styles.emptyDescription}>添加一本书即可在此处查看阅读进度</Text>
                </View>
            }
        />
    );
});

export default BookShelf;

const styles = StyleSheet.create({
    bookList: {
        flex: 1,
    },
    listContent: {},
    emptyContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    bookItem: {
        flexDirection: 'row',
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 1,
        paddingTop: 6
    },
    bookCover: {
        width: 60,
        height: 80,
        borderRadius: 4,
        marginRight: 12,
    },
    resultImagePlaceholder: {
        width: 90,
        height: 120,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    bookInfo: {
        flex: 1,
        paddingTop: 10
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    lastRead: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    emptyDescription: {
        fontSize: 14,
        color: '#999',
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

function getBooks(): Book[] {
    throw new Error("Function not implemented.");
}

