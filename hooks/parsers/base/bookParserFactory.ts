import {BookParser} from "@/hooks/parsers/base/parser.types";
import {XPathParser} from "@/hooks/parsers/xPathParser";

const registry = new Map<BookParser['key'], () => BookParser>()

// 注册解析器（也可以在模块加载时执行）
registry.set('xpath', () => new XPathParser())
// registry.set('css', () => new CssParser())
// registry.set('jsonpath', () => new JsonPathParser())

export function createParser(key: BookParser['key']): BookParser {
    const factory = registry.get(key)
    if (!factory) {
        throw new Error(`Unknown parser type: ${key}`)
    }
    return factory()
}
