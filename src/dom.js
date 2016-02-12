// DOM functions

const FRP = require("frp"),
      DOM = {}

DOM.select = function(selector) {
    return document.querySelector(selector)
}

DOM.selectAll = function(selector) {
    return document.querySelectorAll(selector)
}

DOM.create = function(tagname, text) {
    let elem = document.createElement(tagname)
    if (text) elem.textContent = text
    return elem
}

DOM.on = function(element, name, useCapture) {
    return function(next) {
        element.addEventListener(name, next, !!useCapture)
    }
}

DOM.onClick = function(element, useCapture) {
    return DOM.on(element, 'click', !!useCapture)
}

DOM.onChange = function(element, useCapture) {
    return DOM.on(element, 'change', !!useCapture)
}

DOM.onSubmit = function(element, useCapture) {
    return DOM.on(element, 'submit', !!useCapture)
}

DOM.onResizeWindow = function(throttle) {
    let resizeEvents = DOM.on(window, 'resize')
    if (throttle) resizeEvents = FRP.throttle(resizeEvents, throttle)
    return function(next) {
        resizeEvents(function() {
            next({width: window.innerWidth, height: window.innerHeight})
        })
    }
}

module.exports = DOM