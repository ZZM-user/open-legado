import {StyleSheet, View} from "react-native";
import {Stack} from 'expo-router';
import ParallaxScrollView from "@/components/parallax-scroll-view";
import {Plus} from "lucide-react-native";

export default function PersonScreen() {

    return (
        <>
            <Stack.Screen options={{headerShown: false}}/>
            <ParallaxScrollView
                showBackButton={true}
                headerBackgroundColor={{light: '#FFF', dark: '#1D3D47'}}
                headerElement={
                    <View style={styles.headerContainer}>
                        <p>书源管理</p>
                        <Plus size={23} color="#808080"/>
                    </View>
                }
            >
            </ParallaxScrollView>
        </>
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