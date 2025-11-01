import type {PropsWithChildren, ReactElement} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Animated, {interpolate, useAnimatedRef, useAnimatedStyle, useScrollOffset,} from 'react-native-reanimated';

import {ThemedView} from '@/components/themed-view';
import {useColorScheme} from '@/hooks/use-color-scheme';
import {useThemeColor} from '@/hooks/use-theme-color';
import {useRouter} from "expo-router";
import {ArrowLeft} from "lucide-react-native";

const HEADER_HEIGHT = 56;

type Props = PropsWithChildren<{
    showBackButton?: boolean;
    headerElement?: ReactElement;
    headerBackgroundColor?: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
                                               children,
                                               showBackButton = false,
                                               headerElement,
                                               headerBackgroundColor = {light: '#FFF', dark: '#1D3D47'},
                                           }: Props) {
    const backgroundColor = useThemeColor({}, 'background');
    const colorScheme = useColorScheme() ?? 'light';
    const router = useRouter();
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const scrollOffset = useScrollOffset(scrollRef);
    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollOffset.value,
                        [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
                        [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
                    ),
                },
                {
                    scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
                },
            ],
        };
    });

    return (
        headerElement ? (
                <Animated.ScrollView
                    ref={scrollRef}
                    style={{backgroundColor, flex: 1}}
                    scrollEventThrottle={16}>
                    <Animated.View
                        style={[
                            styles.header,
                            {backgroundColor: headerBackgroundColor?.[colorScheme] || 'light'},
                            headerAnimatedStyle,
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
                </Animated.ScrollView>
            ) :
            <></>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: HEADER_HEIGHT,
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
    },
});
