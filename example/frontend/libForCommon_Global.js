'use strict'

window.onload = function() {
    document.getElementById('b1').onclick = function() {
        require.ensure([], function(require) {
            require('./chunk1');
        });
    };
}




