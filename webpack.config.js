const path = require('path');

module.exports = {
    entry: './src/js/client/main.js',
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'client-bundle.js',
    },
};