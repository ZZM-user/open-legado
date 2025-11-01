import {createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef, useState,} from 'react';

export type RuleType = 'css' | 'xpath' | 'jsonpath' | 'regex';

export type RuleTemplate = {
    key: string;
    label: string;
    description?: string;
    placeholder?: string;
    defaultType?: RuleType;
};

export type RuleGroupKey = 'basic' | 'search' | 'discover' | 'detail' | 'catalog' | 'content';

export type RuleGroupMeta = {
    key: RuleGroupKey;
    title: string;
    description: string;
};

export type BookSourceRule = RuleTemplate & {
    id: string;
    value: string;
    defaultType?: RuleType;
};

export type BookSource = {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    baseUrl: string;
    ruleType: RuleType;
    ruleGroups: Record<RuleGroupKey, BookSourceRule[]>;
};

export type BookSourceManagerState = {
    sources: BookSource[];
    activeSourceId: string | null;
};

export type BookSourceManagerActions = {
    selectSource: (sourceId: string) => void;
    addSource: (source?: Partial<BookSource>) => BookSource;
    updateSourceMeta: (sourceId: string, meta: Partial<BookSource>) => void;
    removeSource: (sourceId: string) => void;
    addRuleToGroup: (sourceId: string, group: RuleGroupKey, rule: Partial<BookSourceRule>) => BookSourceRule;
    updateRule: (sourceId: string, group: RuleGroupKey, ruleId: string, patch: Partial<BookSourceRule>) => void;
    resetRules: (sourceId: string, group: RuleGroupKey) => void;
};

export type UseBookSourceManagerResult = BookSourceManagerState &
    BookSourceManagerActions & {
    activeSource: BookSource | null;
    ruleGroupMeta: RuleGroupMeta[];
    ruleTemplates: Record<RuleGroupKey, RuleTemplate[]>;
    ruleTypeOptions: { label: string; value: RuleType }[];
    getSourceById: (sourceId: string) => BookSource | undefined;
};

const RULE_GROUP_META: RuleGroupMeta[] = [
    {key: 'basic', title: '基本', description: '站点、编码、请求头等基础配置'},
    {key: 'search', title: '搜索', description: '搜索入口、结果解析、分页配置'},
    {key: 'discover', title: '发现', description: '发现频道、分类导航、数据提取'},
    {key: 'detail', title: '详情', description: '书籍详情字段解析规则'},
    {key: 'catalog', title: '目录', description: '章节列表、分页、加密处理'},
    {key: 'content', title: '正文', description: '正文内容、排版、图像处理'},
];

const RULE_TEMPLATES: Record<RuleGroupKey, RuleTemplate[]> = {
    basic: [
        {key: 'baseUrl', label: '站点根地址', placeholder: 'https://example.com'},
        {key: 'charset', label: '页面编码', placeholder: 'utf-8'},
        {
            key: 'headers',
            label: '自定义请求头',
            placeholder: 'User-Agent: ...',
            description: '以 JSON 或 YAML 格式书写'
        },
        {key: 'ruleType', label: '规则类型', placeholder: 'css / xpath / jsonpath / regex'},
    ],
    search: [
        {key: 'searchUrl', label: '搜索地址', placeholder: 'https://example.com/search?q={{key}}'},
        {key: 'itemSelector', label: '搜索列表规则', placeholder: '.result-item'},
        {key: 'titleSelector', label: '书名规则', placeholder: '.title'},
        {key: 'authorSelector', label: '作者规则', placeholder: '.author'},
        {key: 'categorySelector', label: '分类规则', placeholder: '.category'},
        {key: 'introSelector', label: '简介规则', placeholder: '.intro'},
        {key: 'coverSelector', label: '封面规则', placeholder: '.cover'},
        {key: 'detailSelector', label: '详情页地址规则', placeholder: '.detail-url'},
        {key: 'nextPage', label: '翻页规则', placeholder: 'a.next'},
    ],
    discover: [
        {key: 'channels', label: '发现频道配置', placeholder: '[{"title":"玄幻","url":"/xuanhuan"}]'},
        {key: 'itemSelector', label: '列表项规则', placeholder: '.book-item'},
        {key: 'titleSelector', label: '书名规则', placeholder: '.book-title'},
        {key: 'authorSelector', label: '作者规则', placeholder: '.author'},
        {key: 'categorySelector', label: '分类规则', placeholder: '.category'},
        {key: 'introSelector', label: '简介规则', placeholder: '.intro'},
        {key: 'coverSelector', label: '封面规则', placeholder: '.book-cover img::attr(src)'},
        {key: 'detailSelector', label: '详情页地址规则', placeholder: '.detail-url'},
        {key: 'nextPage', label: '翻页规则', placeholder: 'a.next'},
    ],
    detail: [
        {key: 'title', label: '书名规则', placeholder: '.detail-title'},
        {key: 'author', label: '作者规则', placeholder: '.detail-author'},
        {key: 'intro', label: '简介规则', placeholder: '.intro'},
        {key: 'cover', label: '封面规则', placeholder: '.cover'},
        {key: 'intro', label: '简介规则', placeholder: '.detail-intro'},
        {key: 'dir', label: '目录规则', placeholder: '.list > li'},
        {key: 'latestChapter', label: '最新章节规则', placeholder: '.list > li'},
        {key: 'updateTime', label: '更新时间规则', placeholder: '.update-time'},
    ],
    catalog: [
        {key: 'chapterList', label: '章节列表规则', placeholder: '.chapter-list li'},
        {key: 'chapterTitle', label: '章节标题规则', placeholder: 'a'},
        {key: 'chapterUrl', label: '章节链接规则', placeholder: 'a::attr(href)'},
        {key: 'updateTime', label: '更新时间规则', placeholder: '.update-time'},
        {key: 'nextPage', label: '翻页规则', placeholder: 'a.next'},
    ],
    content: [
        {key: 'content', label: '正文规则', placeholder: '.content'},
        {key: 'filter', label: '内容过滤规则', placeholder: ['正则: ^广告', 'CSS: .ads'].join(' / ')},
        {key: 'image', label: '图片提取规则', placeholder: '.content img::attr(src)'},
        {key: 'nextPage', label: '正文下一页规则', placeholder: 'a.next'},
    ],
};

const RULE_TYPE_OPTIONS: { label: string; value: RuleType }[] = [
    {label: 'CSS', value: 'css'},
    {label: 'XPath', value: 'xpath'},
    {label: 'JSONPath', value: 'jsonpath'},
    {label: 'Regex', value: 'regex'},
];

let ruleUidCounter = 0;
let sourceUidCounter = 0;

const createRuleId = () => `rule-${Date.now()}-${ruleUidCounter++}`;
const createSourceId = () => `source-${Date.now()}-${sourceUidCounter++}`;

const hydrateRules = (
    templates: RuleTemplate[],
    initialValues?: Record<string, string>,
): BookSourceRule[] =>
    templates.map((template) => ({
        ...template,
        id: createRuleId(),
        value: initialValues?.[template.key] ?? '',
    }));

const createDefaultSource = (): BookSource => ({
    id: createSourceId(),
    name: '示例书源',
    description: '',
    enabled: true,
    baseUrl: 'https://example.com',
    ruleType: 'css',
    ruleGroups: {
        basic: hydrateRules(RULE_TEMPLATES.basic, {ruleType: 'css'}),
        search: hydrateRules(RULE_TEMPLATES.search),
        discover: hydrateRules(RULE_TEMPLATES.discover),
        detail: hydrateRules(RULE_TEMPLATES.detail),
        catalog: hydrateRules(RULE_TEMPLATES.catalog),
        content: hydrateRules(RULE_TEMPLATES.content),
    },
});

function useBookSourceManagerState(): UseBookSourceManagerResult {
    const initialSourceRef = useRef<BookSource>();
    if (!initialSourceRef.current) {
        initialSourceRef.current = createDefaultSource();
    }
    const initialSource = initialSourceRef.current;

    const [sources, setSources] = useState<BookSource[]>(() => (initialSource ? [initialSource] : []));
    const [activeSourceId, setActiveSourceId] = useState<string | null>(() => initialSource?.id ?? null);

    const selectSource = useCallback((sourceId: string) => {
        setActiveSourceId(sourceId);
    }, []);

    const addSource = useCallback((source?: Partial<BookSource>) => {
        const template = createDefaultSource();
        const nextSource: BookSource = {
            ...template,
            ...source,
            id: createSourceId(),
            ruleGroups: {
                ...template.ruleGroups,
                ...source?.ruleGroups,
            },
        };

        setSources((prev) => [...prev, nextSource]);
        setActiveSourceId(nextSource.id);
        return nextSource;
    }, []);

    const removeSource = useCallback((sourceId: string) => {
        setSources((prev) => {
            const next = prev.filter((item) => item.id !== sourceId);
            setActiveSourceId((current) => {
                if (current !== sourceId) return current;
                return next[0]?.id ?? null;
            });
            return next;
        });
    }, []);

    const updateSourceMeta = useCallback((sourceId: string, meta: Partial<BookSource>) => {
        setSources((prev) => prev.map((item) => (item.id === sourceId ? {...item, ...meta, id: item.id} : item)));
    }, []);

    const addRuleToGroup = useCallback(
        (sourceId: string, group: RuleGroupKey, rule: Partial<BookSourceRule>) => {
            const createdRule: BookSourceRule = {
                id: rule.id ?? createRuleId(),
                key: rule.key ?? `custom-${Date.now()}`,
                label: rule.label ?? '自定义规则',
                description: rule.description,
                placeholder: rule.placeholder,
                value: '',
            };

            setSources((prev) =>
                prev.map((source) => {
                    if (source.id !== sourceId) return source;

                    const groupRules = source.ruleGroups[group] ?? [];

                    return {
                        ...source,
                        ruleGroups: {
                            ...source.ruleGroups,
                            [group]: [...groupRules, createdRule],
                        },
                    };
                }),
            );

            return createdRule;
        },
        [],
    );

    const updateRule = useCallback(
        (sourceId: string, group: RuleGroupKey, ruleId: string, patch: Partial<BookSourceRule>) => {
            setSources((prev) =>
                prev.map((source) => {
                    if (source.id !== sourceId) return source;

                    const updatedGroup = source.ruleGroups[group]?.map((rule) =>
                        rule.id === ruleId ? {...rule, ...patch, id: rule.id} : rule,
                    );

                    return {
                        ...source,
                        ruleGroups: {
                            ...source.ruleGroups,
                            [group]: updatedGroup ?? [],
                        },
                    };
                }),
            );
        },
        [],
    );

    const resetRules = useCallback((sourceId: string, group: RuleGroupKey) => {
        setSources((prev) =>
            prev.map((source) => {
                if (source.id !== sourceId) return source;

                return {
                    ...source,
                    ruleGroups: {
                        ...source.ruleGroups,
                        [group]: hydrateRules(
                            RULE_TEMPLATES[group],
                            group === 'basic'
                                ? {ruleType: source.ruleType}
                                : undefined,
                        ),
                    },
                };
            }),
        );
    }, []);

    const activeSource = useMemo(
        () => sources.find((source) => source.id === activeSourceId) ?? null,
        [sources, activeSourceId],
    );

    const getSourceById = useCallback(
        (sourceId: string) => sources.find((source) => source.id === sourceId),
        [sources],
    );

    const ruleTemplates = RULE_TEMPLATES;

    const ruleTypeOptions = RULE_TYPE_OPTIONS;

    return {
        sources,
        activeSourceId,
        activeSource,
        selectSource,
        addSource,
        updateSourceMeta,
        removeSource,
        addRuleToGroup,
        updateRule,
        resetRules,
        ruleGroupMeta: RULE_GROUP_META,
        ruleTemplates,
        ruleTypeOptions,
        getSourceById,
    };
}

export const BookSourceRuleGroupMeta = RULE_GROUP_META;
export const BookSourceRuleTemplates = RULE_TEMPLATES;

const BookSourceManagerContext = createContext<UseBookSourceManagerResult | null>(null);

export function BookSourceManagerProvider({children}: PropsWithChildren<{}>) {
    const state = useBookSourceManagerState();
    return (
        <BookSourceManagerContext.Provider value={state}>
            {children}
        </BookSourceManagerContext.Provider>
    );
}

export function useBookSourceManager(): UseBookSourceManagerResult {
    const context = useContext(BookSourceManagerContext);
    if (!context) {
        throw new Error('useBookSourceManager 必须在 BookSourceManagerProvider 内使用');
    }
    return context;
}

