import {index, integer, primaryKey, sqliteTable, text} from 'drizzle-orm/sqlite-core';
import {InferSelectModel} from "drizzle-orm";

// 书架分组
export const bookshelfGroups = sqliteTable('bookshelf_groups', {
        id: integer('id').primaryKey({autoIncrement: true}),
        name: text('name').notNull(),
        sortOrder: integer('sort_order').default(0),
        createdTime: integer('created_time').default(Date.now()),
        updatedTime: integer('updated_time').default(Date.now()),
    },
    (table) => ({
        idIndex: index('idx_group_id').on(table.id),
        nameIndex: index('idx_group_name').on(table.name),
        orderIndex: index('idx_group_sortOrder').on(table.sortOrder),
    }));

// 书架表
export const books = sqliteTable('books', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    author: text('author'),
    coverUrl: text('cover_url'),
    intro: text('intro'),
    detailUrl: text('detail_url'),
    bookSourceId: integer('book_source_id').references(() => bookSources.id),
    groupId: integer('group_id').references(() => bookshelfGroups.id),
    createdTime: integer('created_time').default(Date.now()),
    updatedTime: integer('updated_time').default(Date.now()),
}, (table) => ({
    idIndex: index('idx_books_id').on(table.id),
    titleIndex: index('idx_books_title').on(table.title),
    groupIdIndex: index('idx_books_group_id').on(table.groupId),
    bookSourceIdIndex: index('idx_books_book_source_id').on(table.bookSourceId),
}));

export const readingProgress = sqliteTable('reading_progress', {
    id: integer('id').primaryKey({autoIncrement: true}),
    bookId: text('book_id').references(() => books.id),
    chapterName: text('chapter_name'),
    chapterIndex: integer('chapter_index'),
    chapterUrl: text('chapter_url'),
    chapterProgress: integer('chapter_progress'),
    createdTime: integer('created_time').default(Date.now()),
}, (table) => ({
    idIndex: index('idx_reading_progress_id').on(table.id),
    bookIdIndex: index('idx_reading_progress_book_id').on(table.bookId),
}))

// 每一个书源站点（主表）
export const bookSources = sqliteTable('book_sources', {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(), // 书源名称
    baseUrl: text('base_url').notNull(), // 根地址
    headers: text('headers'), // JSON 格式的请求头
    enabled: integer('enabled').default(1), // 是否启用
    ruleType: text('rule_type').default('css'), // css / xpath / jsonpath / regex
    ruleGroups: text('rule_groups').default('{}'), // 规则合集 存json

    // 元信息
    createdTime: integer('created_time').default(Date.now()),
    updatedTime: integer('updated_time').default(Date.now()),
}, (t) => ({
    pk: primaryKey({columns: [t.id]}),
    nameIndex: index('idx_book_source_name').on(t.name),
    enabledIndex: index('idx_book_source_enabled').on(t.enabled),
    idIndex: index('idx_book_source_id').on(t.id),
    updatedTimeIndex: index('idx_book_source_updated_time').on(t.updatedTime),
}));


type DbBookRecord = InferSelectModel<typeof books>;
export type Book = DbBookRecord & {};

type DbBookSourcesRecord = InferSelectModel<typeof bookSources>;
export type BookSources = DbBookSourcesRecord & {};

type DbBookReadingProcessRecord = InferSelectModel<typeof readingProgress>;
export type BookReadingProcess = DbBookReadingProcessRecord & {};