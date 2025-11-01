import ParallaxScrollView from '@/components/parallax-scroll-view';
import {RuleGroupKey, RuleType, useBookSourceManager} from '@/hooks/use-book-source-manager';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,} from 'react-native';

export default function BookSourceDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const sourceId = useMemo(() => {
        const raw = params.id;
        if (Array.isArray(raw)) {
            return raw[0];
        }
        return raw ?? '';
    }, [params.id]);

    const {
        getSourceById,
        updateSourceMeta,
        addRuleToGroup,
        updateRule,
        resetRules,
        ruleGroupMeta,
        ruleTypeOptions,
    } = useBookSourceManager();

    const editingSource = getSourceById(sourceId) ?? null;

    const [activeGroup, setActiveGroup] = useState<RuleGroupKey>('basic');

    const currentGroupMeta = useMemo(
        () => ruleGroupMeta.find((group) => group.key === activeGroup),
        [ruleGroupMeta, activeGroup],
    );

    if (!editingSource) {
        return (
            <ParallaxScrollView
                showBackButton
                headerBackgroundColor={{light: '#FFF', dark: '#1D3D47'}}
                headerElement={<View/>}
            >
                <View style={styles.missingContainer}>
                    <Text style={styles.missingTitle}>未找到对应的书源</Text>
                    <Text style={styles.missingDescription}>请返回列表重新选择或新建书源。</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>返回列表</Text>
                    </TouchableOpacity>
                </View>
            </ParallaxScrollView>
        );
    }

    return (
        <ParallaxScrollView
            showBackButton
            headerBackgroundColor={{light: '#FFF', dark: '#1D3D47'}}
            headerElement={
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>配置：{editingSource.name}</Text>
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
                                    updateSourceMeta(editingSource.id, {name: text})
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
                                        updateSourceMeta(editingSource.id, {baseUrl: text})
                                    }
                                />
                            </View>
                            <View style={styles.fieldHalfToggle}>
                                <Text style={styles.label}>启用状态</Text>
                                <View style={styles.toggleRow}>
                                    <Switch
                                        value={editingSource.enabled}
                                        onValueChange={(value) =>
                                            updateSourceMeta(editingSource.id, {enabled: value})
                                        }
                                    />
                                    <Text style={styles.toggleText}>
                                        {editingSource.enabled ? '已启用' : '已停用'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.fieldBlock}>
                            <Text style={styles.label}>规则类型</Text>
                            <View style={styles.ruleTypeOptionsRow}>
                                {ruleTypeOptions.map((option) => {
                                    const isActive = option.value === editingSource.ruleType;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.typeBadge,
                                                isActive && styles.typeBadgeActive,
                                            ]}
                                            onPress={() =>
                                                updateSourceMeta(editingSource.id, {
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
                        {!!editingSource.description && (
                            <Text style={styles.hintText}>{editingSource.description}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>规则配置</Text>
                    <View style={styles.groupTabs}>
                        {ruleGroupMeta.map((group) => (
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
                                        updateRule(editingSource.id, activeGroup, rule.id, {
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
    fieldHalfToggle: {
        flex: 1,
        gap: 8,
        alignItems: 'flex-start',
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

