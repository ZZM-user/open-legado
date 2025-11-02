import {StyleSheet, View} from 'react-native';
import {useLocalSearchParams} from "expo-router";
import {useBookshelf} from "@/hooks/use-bookshelf";


export default function ReadScreen() {
    const {bookId} = useLocalSearchParams<{ id: string }>();
    const {getBookById} = useBookshelf();

    return (
        <View>

        </View>
    );
}

const styles = StyleSheet.create({});