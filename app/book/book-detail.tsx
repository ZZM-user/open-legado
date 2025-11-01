import {StyleSheet} from 'react-native';
import ParallaxScrollView from "@/components/parallax-scroll-view";

// Define book detail type
type BookDetail = {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    intro?: string;
    sourceId: string;
    sourceName: string;
    detailUrl?: string;
    allSourceIds?: string[]; // List of all sources that have this book
};


export default function BookDetailScreen() {
    return (
        <ParallaxScrollView></ParallaxScrollView>
    );
}

const styles = StyleSheet.create({});