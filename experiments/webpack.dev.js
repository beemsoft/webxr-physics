const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require('fs');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        host: 'localhost',
        port: 8081,
        https: {
            key: fs.readFileSync('certs/key.pem'),
            cert: fs.readFileSync('certs/cert.pem'),
            // ca: fs.readFileSync('certs/rootSSL.pem')
        },
        disableHostCheck: true
    }
});
