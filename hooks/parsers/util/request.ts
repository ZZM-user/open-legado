import {BookSourceRule} from "@/hooks/use-book-source";

export class ParseBookUtil {

    /**
     * 获取 HTML 内容
     * @returns HTML 字符串或 undefined
     * @param url
     * @param rule
     */
    static async getHtml(url: string, rule: BookSourceRule[]): Promise<string> {
        // 获取 headers
        let headers: Record<string, string> = {};
        const headersRule = rule.find(r => r.key === 'headers');
        if (headersRule?.value) {
            try {
                headers = JSON.parse(headersRule.value);
            } catch (err) {
                console.warn('Failed to parse headers:', err);
            }
        }

        // 发起请求
        try {
            const res = await fetch(url, {method: 'GET', headers});
            if (!res.ok) {
                console.error('Fetch error:', res.statusText);
                return ''
            }
            return await res.text();
        } catch (err) {
            console.error('Fetch error:', err);
            return '';
        }
    }
}