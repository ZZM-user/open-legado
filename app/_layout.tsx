import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/use-color-scheme';

export const unstable_settings = {
    anchor: '(tabs)',
};

const routeTitleMap: Record<string, string> = {
    'manager/book-source': '书源管理',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
                screenOptions={({route}) => ({
                    title: routeTitleMap[route.name] ?? route.name,
                    headerBackTitle: '返回',
                })}
            >
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
            </Stack>
            <StatusBar style="auto"/>
        </ThemeProvider>
    );
}
