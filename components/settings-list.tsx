// SettingsList.tsx
import React from 'react';
import {StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {ChevronRight} from "lucide-react-native";

interface SettingItem {
    id: string;
    icon: React.ReactElement;
    title: string;
    description?: string;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    onPress?: () => void;
}

interface SettingGroup {
    id: string;
    title?: string;
    items: SettingItem[];
}

interface SettingsListProps {
    groups: SettingGroup[];
}

export const SettingsList: React.FC<SettingsListProps> = ({groups}) => {
    return (
        <View style={styles.container}>
            {groups.map((group) => (
                <View key={group.id} style={styles.groupContainer}>
                    {group.title && (
                        <Text style={styles.groupTitle}>{group.title}</Text>
                    )}
                    {group.items.map((item) => (
                        <SettingRow key={item.id} item={item}/>
                    ))}
                </View>
            ))}
        </View>
    );
};

interface SettingRowProps {
    item: SettingItem;
}

const SettingRow: React.FC<SettingRowProps> = ({item}) => {
    const hasDescription = !!item.description;

    return (
        <TouchableOpacity
            style={[styles.rowContainer, hasDescription && styles.rowWithDescription]}
            onPress={item.onPress}
            disabled={!item.onPress}
        >
            <View style={styles.icon}>
                {item.icon}
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                {hasDescription && (
                    <Text style={styles.description}>{item.description}</Text>
                )}
            </View>

            {item.showSwitch ? (
                <Switch
                    value={item.switchValue}
                    onValueChange={item.onSwitchChange}
                    style={styles.switch}
                />
            ) : (
                <ChevronRight
                    size={30}
                    color="#C7C7CC"
                    style={styles.chevron}
                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    groupContainer: {
        marginTop: 4,
        marginBottom: 6
    },
    groupTitle: {
        fontSize: 13,
        color: '#8E8E93',
        paddingHorizontal: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderStyle: 'solid',
        borderColor: '#F8F8F8',
        borderBottomWidth: 1,
    },
    rowWithDescription: {
        alignItems: 'flex-start',
        paddingVertical: 8,
    },
    icon: {
        marginRight: 12,
        paddingTop: 6,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 15,
        color: '#000000',
    },
    description: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    switch: {
        marginLeft: 'auto',
    },
    chevron: {
        marginLeft: 'auto',
        marginTop: 8
    },
});
