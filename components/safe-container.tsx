import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {PropsWithChildren} from "react";


type Props = PropsWithChildren<{
    style?: any;
    fullScreen?: boolean;
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
}>;

export default function SafeAreaContainer({
                                              children,
                                              style = {},
                                              fullScreen = false,
                                              top = true,
                                              bottom = true,
                                              left = true,
                                              right = true
                                          }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={
                [
                    style,
                    {
                        flex: 1,
                        paddingTop: fullScreen ? 0 : top ? insets.top : 0,
                        paddingBottom: fullScreen ? 0 : bottom ? insets.bottom : 0,
                        paddingLeft: fullScreen && left ? 0 : left ? insets.left : 0,
                        paddingRight: fullScreen && right ? 0 : right ? insets.right : 0,
                    },
                ]
            }
        >
            {children}
        </View>
    );
}
