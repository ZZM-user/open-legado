import type {PropsWithChildren, ReactElement} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Animated from 'react-native-reanimated';

import {ThemedView} from '@/components/themed-view';
import {useColorScheme} from '@/hooks/use-color-scheme';
import {useRouter} from "expo-router";
import {ArrowLeft} from "lucide-react-native";
import SafeAreaContainer from "@/components/safe-container";

type Props = PropsWithChildren<{
    showBackButton?: boolean;
    headerElement?: ReactElement;
    headerBackgroundColor?: { dark: string; light: string };
    fullScreen?: boolean;
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
}>;

export default function ParallaxScrollView({
                                               children,
                                               showBackButton = false,
                                               headerElement,
                                               headerBackgroundColor = {light: '#FFF', dark: '#1D3D47'},
                                               fullScreen = false,
                                               top = true,
                                               bottom = false,
                                               left = true,
                                               right = true
                                           }: Props) {
    const colorScheme = useColorScheme() ?? 'light';
    const router = useRouter();

    return (
        headerElement ? (
                <>
                    <SafeAreaContainer fullScreen={fullScreen} top={top} bottom={bottom} left={left} right={right}>
                        <Animated.View
                            style={[
                                styles.header,
                                {backgroundColor: headerBackgroundColor?.[colorScheme] || 'light'},
                            ]}>

                            {/* 左侧返回按钮 */}
                            {showBackButton && router.canGoBack() && (
                                <TouchableOpacity onPress={() => router.back()} style={{marginLeft: 12}}>
                                    <ArrowLeft size={22} color="#333"/>
                                </TouchableOpacity>
                            )}

                            {/* 自定义 header 元素 */}
                            {headerElement && (
                                <View style={{flex: 1}}>
                                    {headerElement}
                                </View>
                            )}
                        </Animated.View>
                        <ThemedView style={styles.content}>{children}</ThemedView>
                    </SafeAreaContainer>
                </>
            ) :
            <></>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 56,
        overflow: 'visible',
        zIndex: 1,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.35)',
        flexDirection: 'row',        // 横向排列
        alignItems: 'center',        // 垂直居中
    },
    content: {
        flex: 1,
        padding: 10,
        gap: 16,
        overflow: 'hidden',
        zIndex: 0,
    },
});
