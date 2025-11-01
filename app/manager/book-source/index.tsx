import ParallaxScrollView from '@/components/parallax-scroll-view';
import { useBookSourceManager } from '@/hooks/use-book-source-manager';
import { useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function BookSourceListScreen() {
    const router = useRouter();
    const { sources, addSource, updateSourceMeta, removeSource } = useBookSourceManager();

    const handleAddSource = () => {
        const created = addSource({ name: `新建书源 ${sources.length + 1}` });
        router.push(`/manager/book-source/${created.id}`);
    };

    const handleEditSource = (sourceId: string) => {
        router.push(`/manager/book-source/${sourceId}`);
    };

    return (
        <>
            <ParallaxScrollView
                showBackButton={true}
                headerElement={
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>书源管理</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleAddSource}>
                            <Plus size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>新增书源</Text>
                        </TouchableOpacity>
                    </View>
                }
            >
                <ScrollView contentContainerStyle={styles.container}>
                    {sources.length > 0 ? (
                        <View style={styles.cardList}>
                            {sources.map((source) => (
                                <Pressable
                                    key={source.id}
                                    style={({ pressed }) => [
                                        styles.sourceRow,
                                        pressed && styles.sourceRowPressed,
                                    ]}
                                    onPress={() => handleEditSource(source.id)}
                                >
                                    <View style={styles.sourceInfo}>
                                        <Text style={styles.sourceName}>{source.name}</Text>
                                        <Text style={styles.sourceUrl} numberOfLines={1}>
                                            {source.baseUrl || '未配置站点地址'}
                                        </Text>
                                    </View>
                                    <View style={styles.sourceActions}>
                                        <View style={styles.toggleRow}>
                                            <Switch
                                                value={source.enabled}
                                                onValueChange={(value) =>
                                                    updateSourceMeta(source.id, { enabled: value })
                                                }
                                            />
                                        </View>
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.deleteButton,
                                                pressed && styles.deleteButtonPressed,
                                            ]}
                                            onPress={(event) => {
                                                event.stopPropagation();
                                                removeSource(source.id);
                                            }}
                                        >
                                            <Trash2 size={16} color="#F04438" />
                                        </Pressable>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>暂无书源</Text>
                            <Text style={styles.emptyDescription}>点击右上角按钮即可添加新的书源配置</Text>
                        </View>
                    )}
                </ScrollView>
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
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 18,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: '#1D3D47',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 16,
    },
    cardList: {
        gap: 12,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    sourceRowPressed: {
        backgroundColor: 'rgba(29,61,71,0.08)',
    },
    sourceInfo: {
        flex: 1,
        gap: 4,
    },
    sourceName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1D3D47',
    },
    sourceUrl: {
        fontSize: 13,
        color: '#667085',
    },
    sourceActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleRow: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(240,68,56,0.12)',
    },
    deleteButtonPressed: {
        backgroundColor: 'rgba(240,68,56,0.2)',
    },
    emptyState: {
        alignItems: 'center',
        gap: 8,
        paddingVertical: 120,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1D3D47',
    },
    emptyDescription: {
        fontSize: 14,
        color: '#667085',
    },
});

