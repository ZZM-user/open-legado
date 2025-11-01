import {BookSourceManagerProvider} from '@/hooks/use-book-source-manager';
import {Stack} from 'expo-router';

export default function BookSourceLayout() {
    return (
        <BookSourceManagerProvider>
            <Stack screenOptions={{headerShown: false}}/>
        </BookSourceManagerProvider>
    );
}

