module.exports = function (api: { cache: (arg0: boolean) => void }) {
    api.cache(true)
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ["inline-import", {"extensions": [".sql"]}],
            // NOTE: this is only necessary if you are using reanimated for animations
            'react-native-reanimated/plugin',
        ],
    }
}