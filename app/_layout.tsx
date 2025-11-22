import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {DarkTheme, DefaultTheme, ThemeProvider} from "@react-navigation/native";
import {initialWindowMetrics, SafeAreaProvider} from "react-native-safe-area-context";
import {useMigrations} from "drizzle-orm/expo-sqlite/migrator";
import migrations from "@/drizzle/migrations";
import {db} from "@/db/drizzle";
import {useEffect} from "react";
import {Text, View} from "react-native";

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const {success, error} = useMigrations(db, migrations);

    useEffect(() => {
        if (error) {
            console.error("Migration error: ", error);
        }
    }, [error]);

    if (error) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text>Migration error: {error.message}</Text>
            </View>
        )
    }
    if (!success) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text>Migrations are in progress...</Text>
            </View>
        )
    }


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
