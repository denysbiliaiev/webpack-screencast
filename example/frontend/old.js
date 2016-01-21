'use strict'

function foo() {
    setTimeout(function() {
        alert(`hello ${state.name}`);
    }, 1000);
}

foo();