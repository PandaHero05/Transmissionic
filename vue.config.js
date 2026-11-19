const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
module.exports = {
    transpileDependencies: ['@vue/reactivity'],
    productionSourceMap: false,
    configureWebpack: {
        resolve: {
            alias: {
                // Pure-JS SHA-1 fallback when crypto.subtle is unavailable (plain http)
                'uint8-util$': path.resolve(__dirname, 'src/shims/uint8-util.js'),
                'uint8-util-original$': path.resolve(__dirname, 'node_modules/uint8-util/browser.js')
            }
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.PACKAGE_VERSION': '"' + version + '"'
            }),
            new NodePolyfillPlugin()
        ]
    }
}