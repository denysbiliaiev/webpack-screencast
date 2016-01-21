'use strict'

/*
   контекст подключение всех файлов дериктории.
 __webpack_require__(1) промежуточный модуль контекст, хранит какие файлы подключены, и умеет возвращать нужный
 в данном случае по moduleName
 */

let moduleName = location.pathname.slice('1');// /login

/* контекст через require */
//require('bundle!./routes/' + moduleName)(function(module) {
//    module()
//});

/* require.context */
let handler;

try{
    /* bundle! все файлы из контекста в отдельном фрагменте */
    let context = require.context('bundle!./routes', false);
    handler = context('./' + moduleName);// обертка require.ensure которую вернул bundle
} catch (e) {
    alert('no such path');
}

if (handler) {
    handler(function(module) {
        module();
    });
}

//module.exports = (
//    alert('app.jsx')
//);

