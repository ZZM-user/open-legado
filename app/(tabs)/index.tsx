import BookShelf from "@/components/book-shelf";
import ParallaxScrollView from '@/components/parallax-scroll-view';
import {Search} from "lucide-react-native";
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {router} from 'expo-router';
import {useBookStore} from "@/store/bookStore";

export default function HomeScreen() {
    const bookStore = useBookStore();

    const handleSearchPress = () => {
        router.push('/book/search');
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{light: '#FFF', dark: '#1D3D47'}}
            headerElement={
                <View style={styles.headerContainer}>
                    <View style={styles.header}>
                        <Text>首页</Text>
                        <Text>本地</Text>
                    </View>
                    <TouchableOpacity onPress={handleSearchPress}>
                        <Search
                            size={26}
                            color="#808080"
                        />
                    </TouchableOpacity>
                </View>
            }
        >
            <BookShelf onBookPress={(book) => {
                // TODO 跳转到阅读页面
                // bookStore.setBook(
                //     {
                //         id: book.id,
                //         title: book.title,
                //         author: book.author,
                //         coverUrl: book.coverUrl,
                //         sourceId: book.bookSourceId,
                //         sourceName: book.bookSourceName,
                //         detailUrl: result.detailUrl,
                //     },
                //     {
                //         id: result.bookSourceId,
                //         name: result.bookSourceName,
                //         detailUrl: result.detailUrl,
                //     },
                //     result.bookOriginalSource,
                //     result.bookSearchSources,
                // );
                router.push({
                    pathname: '/book/read',
                });
            }}/>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
        paddingLeft: 24,
        paddingRight: 12,
    },
    header: {
        flexDirection: "row",
        gap: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
