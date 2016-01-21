/*
    webpack - динамическая сборка, подгрузка

    for development
    webpack-dev-server --inlline --hot

    webpack --profile --display-modules --display-reasons -v

    Информация о сборке
    webpack --json --profile >stats.json
    webpack.github.io/analyse/
*/

'use strict'

const NODE_ENV = process.env.NODE_ENV;
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const rimraf = require('rimraf');

function addHash(template, hash) {
    //console.log(`${template}?hash=[${hash}]`);
    return NODE_ENV == 'production' ?
        template.replace(/\.[^.]+$/, `.[${hash}]$&`) : `${template}?hash=[${hash}]`;
}

/* мульти-компиляция - сбороки с разными конфигурациями, ватчеры и кешы разделяются, webpack один */
//module.exports = [{}, {}, {}]

module.exports = {
    /* entry absolute path */
    context: __dirname + '/frontend',

    /* нельзя реквайрить точки входа в других файлах, только через script src */
    entry: {
        /* context - хранит какие файлы подключены, и умеет возвращать нужный */
        //context: './context.jsx',
        //changeContext_ContextReplacementPlugin: './changeContext_ContextReplacementPlugin',
        //old: './old',

        /*
            webpack-dev-server/client (--inline) - устанавливает сокет соединение, работает в 2 режимах с перезагрузкой, и hot.
            без перезагрузки (--hot)
              webpack/hot/dev-server слушает событие "message" от webpack-dev-server/client
              dev-server.hot: true
        */
        menu: ['./menu-compile'],

        /* свои библиотеки в common.js, в перменную common экспортируетcя последний модуль */
        //common: ['./libForCommon_Global.js']
    },
    output: {
        path: __dirname + '/public',
        publicPath: '/',//src интернет путь к нашей сборки, использует static "public"
        filename: addHash('[name].js', 'hash'),//hash для изменения кеша браузера
        chunkFilename: addHash('[id].js', 'chunkhash'),//chunkhash для изменения кеша браузера
        library: '[name]',//имена переменных, exports точек входа
    },

    devServer: {
        hot: true,//вкл режим горячей замены
        host: 'localhost',//default
        port: 8080,//default
        /*
        Control flow:
          middlware -> отвечает за сборку и отдачу статики из памяти
            proxy ->
              historyApiFallback ? -> historyApiFallback, middleware для SPA c роутингом все запросы переписывает на index, и смотрит index в middleware
                -> contentBase если запрос не обработан выше ищет в contentBase дериктория для отдачи статики
        */
        //proxy: [{
        //    path: /\.*/,
        //    target: 'http://localhost:3000'
        //}],
        historyApiFallback: true // index.html
        //contentBase: __dirname + '/backend',
    },

    module: {
        /* не парсит внутренние require в библиотеках, ускоряет сборку*/
        noParse: (/\/node_modules\/(angular\/angular|jquery|...)/),

        loaders: [
            {
                test: [/\.(js|es6)$/],
                loader: 'babel',
                query: {
                    presets: ['es2015'],
                    plugins: ['transform-runtime']
                },
                exclude: /node_modules/
            },
            {
                test: [/\.jsx$/],
                include: __dirname + '/components',
                loader: 'babel',
                /* babel-preset-es2015 babel-preset-react babel-plugin-transform-runtime*/
                query: {
                    presets: ['react', 'es2015'],
                    plugins: ['transform-runtime']
                },
            },
            {
                test:   /\.jade$/,
                exclude: /node_modules/,
                loader: "jade"
            },
            {
                /* цепочка справа вернет текст, style обертка,вставляет текст css в дом */
                test:   /\.css/,
                exclude: /node_modules/,
                loader: 'style!css!autoprefixer?browsers=last 2 versions'
            },
            {
            /*
                resolve url переписывает все пути относительно (menu.styl) корневого файла
                'style' обертка для сss котрый хранится в js
            */
                test:   /\.styl$/,
                //exclude: /node_modules/,
                loader: ExtractTextPlugin.extract('style', 'css!stylus?resolve url'),
                //loader: 'style!css!autoprefixer?browsers=last 2 versions!stylus?resolve url'
            },
            /* url-loader возвращает data url(base:64) если размер меньше лимита, иначе file-loader путь к файлу
             * в less url-loader есть по умолчанию
             */
            {
                test:   /\.(png|jpg|svg|ttf|eot|woff|woff2)$/,
                exclude: /\/node_modules\//,
                loader: 'url?name=[path][name].[hash:6].[ext]&limit=4096',//hash:6 - для изменения кеша браузера
                //loader: 'file?name=[path][name].[ext]'
            },
            ///* file-loader for node-modules path*/
            //{
            //    test:   /\.(png|jpg|svg|ttf|eot|woff|woff2)$/,
            //    include: /\/node_modules\//,
            //    loader: 'file?name=[1].[ext]&regExp=node_modules/(.*)'
            //},
            {
                /*
                    exports & imрorts перменные из старых модулей
                    expose-loader експортирует в глобальную переменную
                */
                test: [/old.js$/],
                loader: 'expose?foo!imports?state=>{name: "world"}!exports?foo',
            },

        ]
    },
    plugins: [
        /*
           bundle-loader - делает require.ensure обертки для модулей, используется для контекста.
           require.ensure - динамическая подгрузка. все модули подлюченные внутри помещает в отдельную сборкус chunk,
           3 аргумент в какую сборку поместить. Если модуль есть в require.ensure, он не выносится в common.
        */

        /* CommonsChunkPlugin - собирает общие модули точек сборки также css в отдельную сборку  */
        //new webpack.optimize.CommonsChunkPlugin({
        //    name: 'common',
        //    //minChunks: 2,//минимальное количество совпадений
        //    //chunks: ['page1', 'page2']//только из этих модулей
        //}),
        /* можно подключить еще один, сборка чанков из разных комбинаций модулей
        new webpack.optimize.CommonsChunkPlugin({
            name: 'new_common',
            chunks: ['page7', 'page8']//только из этих модулей
        }),
        */

        /* очищает папку сборки */
        {
            apply: (compiler) => {
                rimraf.sync(compiler.options.output.path);
            }
        },

        /*
            ExtractTextPlugin выносит стили из основных чанков, allChunks:true выносит из всех чанков
            contenthash для изменения кеша браузера
            disable - для интеграции с HotModuleReplacement, динамическая перезагрузка css
        */
        new ExtractTextPlugin(addHash('[name].css', 'contenthash'), {allChunks: true}),//disable: true

        /*
           генерирует информацию о собраной статике в json формате,
           для изоморфного приложения, подключения скриптов css с хешем в имени
        */
        new AssetsPlugin({
            filename: 'assets.json',
            path: __dirname + '/public',
        }),

        /* для SPA приложения, генерирует HTML файл, подключает в него указаные фрагменты сборки */
        new HtmlWebpackPlugin({
            filename: 'index.html',
            chunk: ['menu.js', 'menu.css'],
        }),

        /* Enables Hot Module Replacement */
        new webpack.HotModuleReplacementPlugin(),

        /* глобальные константы*/
        new webpack.DefinePlugin({
            'NODE_ENV': JSON.stringify(NODE_ENV)
        }),

        /* подгружает модули в глобальные переменные */
        new webpack.ProvidePlugin({
            pluck: 'lodash/collection/pluck',
            _: 'lodash'
        }),

        /* изаменяет контекст на нужный, убирает лишние подключения модулей moment */
        new webpack.ContextReplacementPlugin(/\/node_modules\/moment\/locale/, /(ru|en)/),

        /* убирает модуль из сборки (node-modules/moment)*/
        new webpack.IgnorePlugin(/zh-/),

        /* не делает сборку при ошибках */
       // new webpack.NoErrorsPlugin()
    ],

    /*
     подключение глобальных переменных в код, например из CDN,
     если библиотека не в CDN нет глобальной переменной, тогда через DefinePlugin.
     */
    externals: {
        lodash: '_'//при require('lodash') в коде, подключит глобальную переменную _ из CDN
    },

    /* source map
     - inline(помещает внутрь кода сборки)
     - chip(не учитывает позицию и номера строк)
     - module(с учетом лоадеров)
     */
    devtool: NODE_ENV == "development" ? "chip-inline-module-source-map" : null,

    /* пересборка при изменениях */
    watch: true, //NODE_ENV == "development",
    /*ожидание после изменения(задержка перед пересборкой)*/
    watchOptions: {
        aggregateTimeout: 100 //default 300
    },

    /* где webpack искать модули */
    /* для обычных подключений */
    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ['', '.js', '.jsx', '.es6', '.styl']
    },
    /* для лоадеров, ускоряет поиск */
    resolveLoaders: {
        modulesDirectories: ['node_modules'],
        moduleTemplates: ['*-loaders', '*'],
        extensions: ['', '.js']
    },

};

if (NODE_ENV == 'production') {
    module.exports.plugins.push(
        /* сжимает, оптимизирует код, убирает if(false) */
        new webpack.optimize.UglifeJsPlugin({
            warnings: false,
            drop_console: true,
            unsafe: true
        })
    )
}
