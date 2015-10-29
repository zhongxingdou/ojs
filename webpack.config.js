module.exports = {
    entry: "./index.js",
    output: {
        path: __dirname,
        filename: "build.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ]
    },
    devtool: 'source-map'
}