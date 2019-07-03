const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        basic: './basic/src/',
        backspin: './backspin/src/',
        ragdoll: './ragdoll/src/',
        armmodeltest: './armmodeltest/src/'
    },
    devtool: 'inline-source-map',
    devServer: {
        disableHostCheck: true
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
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: '[name]/dist/bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};