import React, {useEffect, useRef} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    GestureResponderEvent,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {themeColors, useReaderStore} from '@/store/useReaderStore';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function ReaderScreen() {
    const insets = useSafeAreaInsets();

    const {
        isMenuVisible,
        toggleMenu,
        setMenuVisible,
        theme,
        fontSize,
        content,
        chapterTitle,
        isLoading,
        fetchChapterContent,
        setFontSize,
        toggleTheme
    } = useReaderStore();

    const colors = themeColors[theme];
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchChapterContent();
    }, []);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: isMenuVisible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isMenuVisible]);

    // === 核心逻辑修改：智能点击判断 ===
    const handlePress = (event: GestureResponderEvent) => {
        if (isMenuVisible) {
            toggleMenu();
        } else {
            setMenuVisible(true);
        }
    };

    // 顶部操作栏 (保持不变)
    const renderTopBar = () => (
        <Animated.View
            style={[
                styles.topBar,
                {
                    backgroundColor: colors.menuBg,
                    opacity: fadeAnim,
                    paddingTop: insets.top,
                    transform: [{translateY: fadeAnim.interpolate({inputRange: [0, 1], outputRange: [-100, 0]})}]
                }
            ]}
            pointerEvents={isMenuVisible ? "auto" : "none"} // 隐藏时禁止点击，防止误触
        >
            <TouchableOpacity style={styles.iconBtn} onPress={() => console.log('Back')}>
                <Ionicons name="chevron-back" size={26} color={colors.menuText}/>
            </TouchableOpacity>
            <Text style={[styles.barTitle, {color: colors.menuText}]} numberOfLines={1}>
                {chapterTitle || "加载中..."}
            </Text>
            <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="ellipsis-horizontal" size={24} color={colors.menuText}/>
            </TouchableOpacity>
        </Animated.View>
    );

    // 底部操作栏 (保持不变)
    const renderBottomBar = () => (
        <Animated.View
            style={[
                styles.bottomBar,
                {
                    backgroundColor: colors.menuBg,
                    opacity: fadeAnim,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                    transform: [{translateY: fadeAnim.interpolate({inputRange: [0, 1], outputRange: [100, 0]})}]
                }
            ]}
            pointerEvents={isMenuVisible ? "auto" : "none"}
        >
            <View style={styles.controlRow}>
                <TouchableOpacity style={styles.textBtn}><Text
                    style={{color: colors.menuText}}>上一章</Text></TouchableOpacity>
                <Text style={{color: colors.menuText, fontSize: 12}}>12.5%</Text>
                <TouchableOpacity style={styles.textBtn}><Text
                    style={{color: colors.menuText}}>下一章</Text></TouchableOpacity>
            </View>
            <View style={[styles.settingsRow, {borderTopColor: colors.text + '20'}]}>
                <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 2))} style={styles.settingBtn}>
                    <Text style={{color: colors.menuText, fontSize: 14}}>A-</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFontSize(Math.min(30, fontSize + 2))} style={styles.settingBtn}>
                    <Text style={{color: colors.menuText, fontSize: 20}}>A+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleTheme} style={[styles.settingBtn, {
                    backgroundColor: theme === 'light' ? '#ddd' : '#555',
                    borderRadius: 15,
                    paddingVertical: 5
                }]}>
                    <Text style={{color: colors.menuText, fontSize: 14}}>{theme === 'light' ? '夜间' : '日间'}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <StatusBar
                barStyle={isMenuVisible ? (theme === 'light' ? "dark-content" : "light-content") : "hidden"}
                backgroundColor="transparent"
                translucent
            />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.text}/>
                    <Text style={{color: colors.text, marginTop: 10}}>正在加载...</Text>
                </View>
            ) : (
                /* 关键修改：
                   1. ScrollView 在最外层，确保滑动优先级最高。
                   2. Pressable 作为 ScrollView 的直接子容器，包裹内容。
                   3. onPress 会自动过滤掉滑动操作（React Native 原生行为：滑动时不会触发 onPress）。
                */
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{
                        // 确保内容少的时候也能铺满屏幕，这样点击下方空白处也能触发
                        minHeight: SCREEN_HEIGHT,
                        paddingBottom: insets.bottom + 80 // 底部留白防止被菜单挡住
                    }}
                    showsVerticalScrollIndicator={false}
                    // 调整滚动事件频率，如果以后要做滚动监听的话
                    scrollEventThrottle={16}
                >
                    <Pressable
                        onPress={handlePress}
                        style={{paddingHorizontal: 20, paddingTop: insets.top + 20, flex: 1}}
                    >
                        <Text style={[styles.chapterName, {color: colors.text}]}>{chapterTitle?.trim() || ""}</Text>

                        <Text style={[
                            styles.content,
                            {
                                color: colors.text,
                                fontSize: fontSize,
                                lineHeight: fontSize * 1.8 // 增加行高，阅读更舒适
                            }
                        ]}>
                            {content}
                        </Text>

                        {/* 底部占位，方便点击 */}
                        <View style={{height: 100}}/>
                    </Pressable>
                </ScrollView>
            )}

            {/* 菜单层，pointerEvents="box-none" 确保点击透明区域时穿透到底下的 ScrollView/Pressable */}
            <View style={styles.overlayContainer} pointerEvents="box-none">
                {renderTopBar()}
                {renderBottomBar()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    chapterName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        marginTop: 10,
    },
    content: {
        textAlign: 'justify', // 两端对齐
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: Platform.OS === 'ios' ? 100 : 80,
        paddingHorizontal: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    barTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    iconBtn: {
        padding: 8,
    },
    bottomBar: {
        paddingTop: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    textBtn: {
        padding: 10,
    },
    settingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        borderTopWidth: 0.5,
    },
    settingBtn: {
        paddingHorizontal: 20,
        paddingVertical: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
});