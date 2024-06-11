import barba from "@barba/core";
import gsap from "gsap";
import Loader from './loader.js';
import {Shop} from "./shop.js";
import {Product} from "./product.js";
import {Nav} from "./utils.js";

gsap.config({
    nullTargetWarn: false,
});

// create context
export let ctx = gsap.context();

let firstLoad = true;

let navigation = new Nav(document.querySelector('.header'));


barba.hooks.enter((data) => {
    gsap.set([data.next.container, data.current.container], { position: "fixed", top: 0, left: 0, width: "100%", height:'100vh' });
});
barba.hooks.after((data) => {
    gsap.set(data.next.container, { position: "relative", height: "auto" });
    window.Webflow && window.Webflow.require("ix2").init();
});

barba.init({
    preventRunning: true,
    views: [
        {
            namespace: "home",
            afterEnter(data) {
                console.log('home')
                new Loader(data.next.container);
            }
        },
        {
            namespace: "info",
            afterEnter(data) {
            },
        },
        {
            namespace: "shop",
            afterEnter(data) {
                console.log('shop')
                new Shop(data.next.container);
            },
        },
        {
            namespace: "product",
            afterEnter(data) {
                new Product(data.next.container);
            },
        },
        {
            namespace: "404",
            beforeEnter() {},
        }
    ],
    transitions: [
        {
            sync: true,
            enter(data) {
                const currentContainer = data.current.container;
                const nextContainer = data.next.container;
                console.log(currentContainer, nextContainer)
                let insetValue = '40%'
                let tlTransition = gsap.timeline({defaults: {ease: "expo.inOut"}});
                tlTransition.set(nextContainer, {clipPath: `inset(${insetValue})`, xPercent: 120})
                    .set([currentContainer.querySelector(".section-transition"),nextContainer.querySelector(".section-transition")], {scale: 1, duration: 0.3})
                    .to(currentContainer, {clipPath: `inset(${insetValue})`, duration: 1})
                    .to(currentContainer, {xPercent: -120, duration: 1})
                    .to(nextContainer, {xPercent: 0, duration: 1}, "<")
                    .to(nextContainer, {clipPath: `inset(0%)`, duration: 1})
                    .to([nextContainer.querySelector(".section-transition")], {opacity: 0, display:'hidden', duration: 1}, "<")
                    .set([nextContainer.querySelector(".section-transition")], {opacity: 1, scale: 0})
                return tlTransition;
            }
        }
    ]
});