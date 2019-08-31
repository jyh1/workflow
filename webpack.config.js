module.exports = (env) => {
    const isdev = env == "dev"
    return ({
        mode: isdev ? "development" : "production",
        watch: isdev,

        // Enable sourcemaps for debugging webpack's output.
        devtool: isdev ? "source-map" : false,

        resolve: {
            // Add '.ts' and '.tsx' as resolvable extensions.
            extensions: [".ts", ".tsx", '.js']
        },

        module: {
            rules: [
                {
                    test: /\.ts(x?)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: "ts-loader"
                        }
                    ]
                },
                // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
                {
                    enforce: "pre",
                    test: /\.js$/,
                    loader: ["source-map-loader"]
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.scss$/,
                    use: [
                        "style-loader", // creates style nodes from JS strings
                        "css-loader", // translates CSS into CommonJS
                        "sass-loader" // compiles Sass to CSS, using Node Sass by default
                    ]
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },

                { 
                    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/
                , loader: "url-loader?limit=10000&mimetype=application/font-woff"
                , options: {publicPaht: './dist/'}
                },
                { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" }

            ]
        },

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            "react": "React",
            "react-dom": "ReactDOM"
        }
    })
};