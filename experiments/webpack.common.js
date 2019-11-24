const path = require('path');
const webpack = require('webpack');

const plugins = [
    new webpack.ProvidePlugin({
        THREE: "three"
    }),
    new webpack.ProvidePlugin({
        CANNON: "cannon"
    })
];

module.exports = {
    entry: {
        basic: './basic/src/',
        backspin: './backspin/src/',
        ragdoll: './ragdoll/src/',
        basicturn: './basicturn/src/',
        armmodeltest: './armmodeltest/src/'
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|svg|jpg|gif|wav)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]'
                    }
                }]
            }
        ]
    },
    plugins: plugins,
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    name: 'commons',
                    chunks: 'initial',
                    minChunks: 2
                }
            }
        }
    },
    output: {
        filename: '[name]/dist/bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};
