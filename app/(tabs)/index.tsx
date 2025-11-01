import {StyleSheet, View} from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import BookShelf from "@/components/book-shelf";
import {Search} from "lucide-react-native";

export default function HomeScreen() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{light: '#FFF', dark: '#1D3D47'}}
            headerElement={
                <View style={styles.headerContainer}>
                    <View style={styles.header}>
                        <p>首页</p>
                        <p>本地</p>
                    </View>
                    <Search
                        size={26}
                        color="#808080"
                    />
                </View>
            }
        >
            <BookShelf/>
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
