import {Tabs} from 'expo-router';
import React from 'react';

import {HapticTab} from '@/components/haptic-tab';
import {Colors} from '@/constants/theme';
import {useColorScheme} from '@/hooks/use-color-scheme';
import {BookOpenText, Compass, UserRound} from "lucide-react-native";

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    height: 90,
                    paddingBottom: 10,
                    paddingTop: 8,
                    // ⭐️ 核心解决 iOS 边线问题
                    borderTopWidth: 0,
                    // ⭐️ 解决 Android 阴影（或边线）问题
                    elevation: 0,
                    shadowOpacity: 0,  // 针对某些安卓设备可能存在的阴影
                },
            }}>

            <Tabs.Screen
                name="index"
                options={{
                    title: '书架',
                    tabBarIcon: ({color}) => <BookOpenText size={26} color={color}/>,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: '发现',
                    tabBarIcon: ({color}) => <Compass size={26} color={color}/>,
                }}
            />
            <Tabs.Screen
                name="person"
                options={{
                    title: '我的',
                    tabBarIcon: ({color}) => <UserRound size={26} color={color}/>,
                }}
            />
        </Tabs>
    );
}
