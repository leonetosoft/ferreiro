var path = require("path");
var webpack = require("webpack");
var fs = require('fs');
//var UglifyJsPlugin = require("uglifyjs-3-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
var PATHS = {
    entryPoint: path.resolve(__dirname, 'src/index.ts'),
    bundles: path.resolve(__dirname, '_bundles'),
}

const { spawn } = require("child_process")

function OnFirstBuildDonePlugin(env) {
    let isInitialBuild = env ? env.AUTO_START : undefined;
    const modules = env ? env.MODULE.split(',') : undefined;
    return {
        apply: compiler => {
            compiler.hooks.done.tap("OnFirstBuildDonePlugin", compilation => {
                ;
                if (isInitialBuild) {
                    isInitialBuild = false;
                    for(const mod  of modules) {
                        spawn("nodemon --signal SIGHUP _bundles/index.js --bundle " + mod, {
                            stdio: "inherit",
                            shell: true
                        })
                    }
                }
            })
        }
    }
}

var nodeModules = {};
fs.readdirSync('node_modules').filter(function (x) {
    return ['.bin'].indexOf(x) === -1;
}).forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
});
module.exports = (env) => {
    return {
        // These are the entry point of our library. We tell webpack to use
        // the name we assign later, when creating the bundle. We also use
        // the name to filter the second entry point for applying code
        // minification via UglifyJS
        entry: {
            'index': [PATHS.entryPoint],
            'index.min': [PATHS.entryPoint]
        },
        target: 'node',
        node: {
            fs: 'empty'
        },
        optimization: {
            minimizer: [new TerserPlugin()],
        },
        // The output defines how and where we want the bundles. The special
        // value `[name]` in `filename` tell Webpack to use the name we defined above.
        // We target a UMD and name it MyLib. When including the bundle in the browser
        // it will be accessible at `window.MyLib`
        output: {
            path: PATHS.bundles,
            filename: '[name].js',
            libraryTarget: 'umd',
            library: 'MyLib' //,
            // umdNamedDefine: true
        },
        // Add resolve for `tsx` and `ts` files, otherwise Webpack would
        // only look for common JavaScript file extension (.js)
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        },
        externals: nodeModules,
        // Activate source maps for the bundles in order to preserve the original
        // source when the user debugs the application
        devtool: 'source-map',
        plugins: [
            // Apply minification only on the second bundle by
            // using a RegEx on the name, which must end with `.min.js`
            // NB: Remember to activate sourceMaps in UglifyJsPlugin
            // since they are disabled by default!
            /*new UglifyJsPlugin({
                uglifyOptions: {
                    warnings: false,
                    ie8: false,
                    output: {
                        comments: false
                    }
                }
            }),*/
            new webpack.IgnorePlugin(/\.(css|less)$/),
            new webpack.BannerPlugin({ raw: true, entryOnly: false, banner: 'require("source-map-support").install();' }),
            OnFirstBuildDonePlugin(env)
        ],
        module: {
            rules: [{
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            }]
        }
    }
}
