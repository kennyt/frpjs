"use strict"

import frp from "frpjs"
import dom from "frpjs/dom"

export default function(selector, slideWidth, slideHeight) {
    let stream$ = frp.compose(
        dom.onTouchStart(selector),
        frp.merge(dom.onTouchMove(selector)),
        frp.merge(dom.onTouchEnd(selector)),

        frp.map(event => ({
            type: event.type,
            pageX: getPageX(event),
            time: event.timeStamp
        })),

        frp.fold((prev, curr) => {
            curr.startX = (curr.type == "touchstart") ? curr.pageX : prev.startX
            curr.startTime = (curr.type == "touchstart") ? curr.time : prev.startTime
            curr.displacement = curr.pageX - curr.startX
            curr.slideIndex = prev.slideIndex

            return curr
        }, { slideIndex: 0 })
    )

    const view = new SwipeView(selector, slideWidth, slideHeight)
    stream$(event => activateEventStream(event, view))
}

function activateEventStream(event, view) {
    if (event.type == "touchmove")
        handleTouchMove(event, view)
    else if (event.type == "touchend")
        handleTouchEnd(event, view)
}

function handleTouchMove(event, view) {
    if (view.canSlideLeft(event) || view.canSlideRight(event)) {
        let distance = -(event.slideIndex * view.slideWidth) + event.displacement
        view.move(distance)
    } else if (view.isPullingEdge(event)) {
        let distance = -(event.slideIndex * view.slideWidth) + (view.edgePadding / view.slideWidth) * event.displacement
        view.move(distance)
    }
}

function handleTouchEnd(event, view) {
    if (view.hasCrossedMidPoint(event) || view.isFlicked(event)) {
        if (view.canSlideRight(event))
            event.slideIndex++
        else if (view.canSlideLeft(event))
            event.slideIndex--
    }

    let distance = -(event.slideIndex * view.slideWidth)
    let time     = view.isFlicked(event) ? 150 : 300
    view.animate(distance, time)
}

function SwipeView(selector, slideWidth, slideHeight) {
    this.slideWidth  = slideWidth  || window.innerWidth
    this.slideHeight = slideHeight || window.innerHeight

    this.container = dom.select(selector)
    this.slider    = this.container.firstElementChild
    this.slides    = this.slider.children

    this.numSlides   = this.slides.length
    this.edgePadding = this.slideWidth / 10

    this.setupStyles()
}

SwipeView.prototype.setupStyles = function() {
    this.container.style["width"]    = this.slideWidth + "px"
    this.container.style["height"]   = this.slideHeight + "px"
    this.container.style["overflow"] = "hidden"

    this.slider.style["width"]     = this.numSlides * 100 + "%"
    this.slider.style["height"]    = "100%"
    this.slider.style["transform"] = "translate3d(0, 0, 0)"

    let slideWidth = this.slideWidth, slideHeight = this.slideHeight
    Array.prototype.forEach.call(this.slides, function(slide) {
        slide.style["width"]  = slideWidth + "px"
        slide.style["height"] = slideHeight + "px"
        slide.style["float"]  = "left"
    })        
}

SwipeView.prototype.canSlideLeft = function(event) {
    return (event.displacement > 0 && event.slideIndex > 0)
}

SwipeView.prototype.canSlideRight = function(event) {
    return (event.displacement < 0 && event.slideIndex < this.numSlides - 1)
}

SwipeView.prototype.isPullingEdge = function(event) {
    let sliderPosition = this.slider.getBoundingClientRect().left
    let nMinusOneSlides = (this.numSlides - 1) * this.slideWidth // width of (n - 1) slides

    return ((0 <= sliderPosition && sliderPosition < this.edgePadding) ||
            (-nMinusOneSlides - this.edgePadding < sliderPosition && sliderPosition <= -nMinusOneSlides))
}

SwipeView.prototype.hasCrossedMidPoint = function(event) {
    return Math.abs(event.displacement) > this.slideWidth/2
}

SwipeView.prototype.isFlicked = function(event) {
    return getSpeed(event) > 1
}

SwipeView.prototype.animate = function(translateX, ms) {
    this.slider.style["transition"] = "transform " + ms +"ms ease-out"
    this.slider.style["transform"]  = "translate3d(" + translateX + "px, 0, 0)"
}

SwipeView.prototype.move = function(translateX) {
    this.slider.style["transition"] = "none"
    this.slider.style["transform"]  = "translate3d(" + translateX + "px, 0, 0)"
}

function getSpeed(event) {
    return Math.abs(event.displacement) / (event.time - event.startTime)
}

function getPageX(event) {
    return (event.type == "touchend") ?
      event.changedTouches[0].pageX : event.targetTouches[0].pageX
}