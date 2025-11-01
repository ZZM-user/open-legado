import ParallaxScrollView from '@/components/parallax-scroll-view';
import {
    BookSource,
    BookSourceRule,
    RULE_GROUP_META,
    RULE_TYPE_OPTIONS,
    RuleGroupKey,
    RuleType,
    useBookSource
} from '@/hooks/use-book-source';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {Save} from "lucide-react-native";

export default function BookSourceDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const bookSourceManager = useBookSource();

    const [editingSource, setEditingSource] = useState<BookSource>(() => {
        const idNumber = params.id ? Number(params.id) : undefined;
        const existingSource = bookSourceManager.getSourceById(idNumber);
        if (existingSource) {
            return {...existingSource};
        } else {
            return bookSourceManager.createDefaultSource();
        }
    });
    const [activeGroup, setActiveGroup] = useState<RuleGroupKey>('basic');
    const [currentGroupMeta, setCurrentGroupMeta] = useState(() => {
        return RULE_GROUP_META[activeGroup];
    });

    // 更新源信息
    const updateSourceMeta = (meta: Partial<BookSource>) => {
        setEditingSource((prev) => ({...prev, ...meta}));
    };

    // 更新规则
    const updateRule = (group: RuleGroupKey, ruleId: string, patch: Partial<BookSourceRule>) => {
        setEditingSource((prev) => {
            const updatedGroup = prev.ruleGroups[group]?.map((rule) =>
                rule.id === ruleId ? {...rule, ...patch} : rule
            ) ?? [];

            return {
                ...prev,
                ruleGroups: {
                    ...prev.ruleGroups,
                    [group]: updatedGroup,
                },
            };
        });
    };

    // 保存源信息
    const updateBookSource = () => {
        if (editingSource.id) {
            bookSourceManager.updateSource(editingSource).then(() => {
                router.back();
            });
        } else {
            bookSourceManager.addSource(editingSource).then(() => {
                router.back();
            });
        }
    };

    return (
        <ParallaxScrollView
            showBackButton
            headerElement={
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>{editingSource.name}</Text>
                    <Save size={24} style={{marginTop: 6}} onPress={() => updateBookSource()}/>
                </View>
            }
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>基础信息</Text>
                    <View style={styles.card}>
                        <View style={styles.fieldBlock}>
                            <Text style={styles.label}>书源名称</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="例如：某小说网"
                                value={editingSource.name}
                                onChangeText={(text) =>
                                    updateSourceMeta({name: text})
                                }
                            />
                        </View>
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldHalf}>
                                <Text style={styles.label}>站点根地址</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="https://example.com"
                                    value={editingSource.baseUrl}
                                    onChangeText={(text) =>
                                        updateSourceMeta({baseUrl: text})
                                    }
                                />
                            </View>
                        </View>
                        <View style={styles.fieldBlock}>
                            <Text style={styles.label}>规则类型</Text>
                            <View style={styles.ruleTypeOptionsRow}>
                                {RULE_TYPE_OPTIONS.map((option) => {
                                    const isActive = option.value === editingSource.ruleType;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.typeBadge,
                                                isActive && styles.typeBadgeActive,
                                            ]}
                                            onPress={() =>
                                                updateSourceMeta({
                                                    ruleType: option.value as RuleType,
                                                })
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.typeBadgeText,
                                                    isActive && styles.typeBadgeTextActive,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>规则配置</Text>
                    <View style={styles.groupTabs}>
                        {RULE_GROUP_META.map((group) => (
                            <TouchableOpacity
                                key={group.key}
                                style={[
                                    styles.groupTab,
                                    group.key === activeGroup && styles.groupTabActive,
                                ]}
                                onPress={() => setActiveGroup(group.key)}
                            >
                                <Text
                                    style={[
                                        styles.groupTabText,
                                        group.key === activeGroup && styles.groupTabTextActive,
                                    ]}
                                >
                                    {group.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {currentGroupMeta && (
                        <Text style={styles.groupDescription}>{currentGroupMeta.description}</Text>
                    )}

                    <View style={styles.ruleList}>
                        {(editingSource.ruleGroups[activeGroup] ?? []).map((rule) => (
                            <View key={rule.id} style={styles.ruleCard}>
                                <View style={styles.ruleHeader}>
                                    <View style={styles.ruleHeaderText}>
                                        <Text style={styles.ruleTitle}>{rule.label}</Text>
                                        {!!rule.description && (
                                            <Text style={styles.ruleDescription}>{rule.description}</Text>
                                        )}
                                    </View>
                                </View>
                                <TextInput
                                    style={styles.ruleInput}
                                    placeholder={rule.placeholder}
                                    multiline
                                    value={rule.value}
                                    onChangeText={(text) =>
                                        updateRule(activeGroup, rule.id, {
                                            value: text,
                                        })
                                    }
                                />
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
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
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    fieldBlock: {
        gap: 8,
    },
    fieldRow: {
        flexDirection: 'row',
        gap: 16,
    },
    fieldHalf: {
        flex: 1,
        gap: 8,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleText: {
        fontSize: 14,
        color: '#666',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        backgroundColor: '#fff',
    },
    hintText: {
        fontSize: 12,
        color: '#666',
    },
    groupTabs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    groupTab: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    groupTabActive: {
        backgroundColor: '#1D3D47',
    },
    groupTabText: {
        fontSize: 14,
        color: '#1D3D47',
    },
    groupTabTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    groupDescription: {
        fontSize: 13,
        color: '#666',
    },
    ruleList: {
        gap: 16,
    },
    ruleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 2},
        elevation: 2,
    },
    ruleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ruleHeaderText: {
        flex: 1,
        gap: 4,
    },
    ruleTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1D3D47',
    },
    ruleDescription: {
        fontSize: 12,
        color: '#667085',
    },
    ruleTypeOptionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(29,61,71,0.08)',
    },
    typeBadgeActive: {
        backgroundColor: '#1D3D47',
    },
    typeBadgeText: {
        fontSize: 13,
        color: '#1D3D47',
    },
    typeBadgeTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    ruleInput: {
        minHeight: 30,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        padding: 8,
        fontSize: 14,
        textAlignVertical: 'top',
        backgroundColor: 'rgba(249,250,251,1)',
    },
    missingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    missingTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    missingDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    backButton: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#1D3D47',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

