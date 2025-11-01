import ParallaxScrollView from "@/components/parallax-scroll-view";
import {StyleSheet, View} from 'react-native';
import {SettingsList} from "@/components/settings-list";
import {useRouter} from "expo-router";
import {BadgeQuestionMark, BellDot, BookText, Palette} from "lucide-react-native";


export default function PersonScreen() {
    const router = useRouter();

    const settingGroups: SettingGroup[] = [
        {
            id: 'account',
            title: '基础',
            items: [
                {
                    id: 'book-source',
                    icon: <BookText/>,
                    title: '书源',
                    description: '管理书源',
                    onPress: () => router.push('/manager/book-source')
                },
                {
                    id: 'notifications',
                    icon: <BellDot/>,
                    title: '通知设置',
                    showSwitch: true,
                    switchValue: true,
                    onSwitchChange: (value: any) => console.log('Notifications:', value)
                }
            ]
        },
        {
            id: 'preferences',
            title: '偏好设置',
            items: [
                {
                    id: 'dark-mode',
                    icon: <Palette/>,
                    title: '深色模式',
                    showSwitch: true,
                    switchValue: false,
                    onSwitchChange: (value: any) => console.log('Dark mode:', value)
                }
            ]
        }
    ];

    return (
        <ParallaxScrollView
            headerBackgroundColor={{light: '#FFF', dark: '#1D3D47'}}
            headerElement={
                <View style={styles.headerContainer}>
                    <p>我的</p>
                    <BadgeQuestionMark size={23}
                                       color="#808080"
                    />
                </View>
            }
        >
            <SettingsList groups={settingGroups}/>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 16,
        fontWeight: "bold"
    },
});
