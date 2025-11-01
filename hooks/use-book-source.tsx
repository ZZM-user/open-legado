import {db} from "@/db/drizzle";
import {bookSources} from "@/db/schema";
import {eq} from "drizzle-orm";

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
    id?: number;
    name: string;
    enabled: boolean;
    headers?: string;
    baseUrl: string;
    ruleType: RuleType;
    ruleGroups: Record<RuleGroupKey, BookSourceRule[]>;
};

function mapDBToBookSource(db: {
    id?: number | null;
    name: string | null;
    enabled?: number | null;
    baseUrl?: string | null;
    ruleType?: string | null;
    ruleGroups?: string | null;
}): BookSource {
    return {
        id: db.id ?? undefined,
        name: db.name ?? '新建书源',
        enabled: !!db.enabled,
        baseUrl: db.baseUrl ?? 'https://example.com',
        ruleType: (db.ruleType ?? 'css') as RuleType,
        ruleGroups: db.ruleGroups ? JSON.parse(db.ruleGroups) : {},
    };
}

export const RULE_GROUP_META: RuleGroupMeta[] = [
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

export const RULE_TYPE_OPTIONS: { label: string; value: RuleType }[] = [
    {label: 'CSS', value: 'css'},
    {label: 'XPath', value: 'xpath'},
    {label: 'JSONPath', value: 'jsonpath'},
    {label: 'Regex', value: 'regex'},
];

let ruleUidCounter = 0;

const createRuleId = () => `rule-${Date.now()}-${ruleUidCounter++}`;

const hydrateRules = (
    templates: RuleTemplate[],
    initialValues?: Record<string, string>,
): BookSourceRule[] =>
    templates.map((template) => ({
        ...template,
        id: createRuleId(),
        value: initialValues?.[template.key] ?? '',
    }));

export const createDefaultSource = (): BookSource => ({
    name: '新建书源',
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

export function useBookSource() {

    const addSource = async (source: Partial<BookSource> = {}) => {
        const newSource = {
            ...source,
            name: source.name ?? '新建书源',
            baseUrl: source.baseUrl ?? 'https://example.com',
            enabled: source.enabled ? 1 : 0,
            ruleGroups: JSON.stringify(source.ruleGroups),
        };
        await db.insert(bookSources).values(newSource);
        return newSource;
    };

    const updateSource = async (patch: Partial<BookSource>) => {
        if (!patch.id) return;

        // 先获取原数据
        const existing = await db.select().from(bookSources).where(eq(bookSources.id, patch.id)).get();
        if (!existing) return;

        // 合并数据
        const updated = {
            ...existing,
            ...patch,
            enabled: patch.enabled ? 1 : 0,
            ruleGroups: patch.ruleGroups ? JSON.stringify(patch.ruleGroups) : existing.ruleGroups,
        };

        // 更新到数据库
        await db.update(bookSources)
            .set(updated)
            .where(eq(bookSources.id, existing.id));
    };

    const removeSource = (id: number) => {
        db.delete(bookSources).where(eq(bookSources.id, id));
    };

    const getSourceById = (id?: number) => {
        if (!id) return undefined;
        const result = db.select().from(bookSources).where(eq(bookSources.id, id)).get();
        return result ? {
            ...result,
            ruleGroups: result.ruleGroups ? JSON.parse(result.ruleGroups) : createDefaultSource().ruleGroups,
        } : undefined;
    };

    const getAllSources = () => {
        const result = db.select().from(bookSources).all();
        return result.map((item) => ({
            ...item,
            ruleGroups: item.ruleGroups ? JSON.parse(item.ruleGroups) : createDefaultSource().ruleGroups,
        }));
    };

    return {
        addSource,
        updateSource,
        removeSource,
        getSourceById,
        createDefaultSource,
        getAllSources,
    };
}


export const BookSourceRuleGroupMeta = RULE_GROUP_META;
export const BookSourceRuleTemplates = RULE_TEMPLATES;
