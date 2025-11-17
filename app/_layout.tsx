import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {DarkTheme, DefaultTheme, ThemeProvider} from "@react-navigation/native";
import {initialWindowMetrics, SafeAreaProvider} from "react-native-safe-area-context";
import {useMigrations} from "drizzle-orm/expo-sqlite/migrator";
import migrations from "@/drizzle/migrations";
import {db} from "@/db/drizzle";

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    useMigrations(db, migrations);

    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{headerShown: false}}
                >

                    <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                    <Stack.Screen name="modal" options={{presentation: 'modal', headerShown: false}}/>
                </Stack>
                <StatusBar style="auto"/>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
