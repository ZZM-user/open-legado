import * as Crypto from 'expo-crypto';

/**
 * 使用 SHA-256 哈希算法生成唯一的缓存键。
 * @param parserVersion 解析规则版本 (例如: "v1.2") - **强烈推荐**
 * @returns {Promise<string>} 唯一的哈希缓存键
 */
export async function generateCryptoKey(
    args: (string | number | boolean | null | undefined)[],
    parserVersion: string = 'v1'
): Promise<string> {
    const keyString = [parserVersion, ...args].join('::');
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        keyString
    );

    return `CACHE:${digest}`;
}
