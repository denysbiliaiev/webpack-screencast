'use strict'

/* ProvidePlugin - автоматически подключает необьявленные переменные  */

//let pluck = require('lodash/collection/pluck');

let users = [
    {id:1, name:'user1'},
    {id:2, name:'user2'},
    {id:3, name:'user3'},
];

console.log(pluck(users, 'name'));