import barba from "@barba/core";
import gsap from "gsap";
import Loader from './loader.js';
import {About} from "./about.js";
import {Home} from "./home.js";
import {Shop} from "./shop.js";
import {Product} from "./product.js";
import {Footer, Nav} from "./utils.js";
import {Music} from "./music.js";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Time from "./time.js";
import Lenis from 'lenis';
import {Videos} from "./videos.js";
import {Film} from "./film.js";

// Initialize Lenis smooth scrolling
const lenis = new Lenis({ smooth: true });
const requestAnimationFrameLoop = (time) => {
    lenis.raf(time);
    requestAnimationFrame(requestAnimationFrameLoop);
};
requestAnimationFrame(requestAnimationFrameLoop);

gsap.config({
    nullTargetWarn: false,
});

// Function to reset Webflow settings after page transitions
function resetWebflow(data) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(data.next.html, "text/html");
    const webflowPageId = dom.querySelector("html").getAttribute("data-wf-page");
    const siteId = dom.querySelector("html").getAttribute("data-wf-site");

    document.querySelector("html").setAttribute("data-wf-page", webflowPageId);

    if (window.Webflow && window.Webflow.require) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('commerce').init({ siteId: siteId });
        window.Webflow.require("ix2").init();
    }
}

let firstLoad = true;

// Reusable function to initialize common components like Nav and Footer
function initializeCommonComponents(container) {
    new Nav(container);
    new Footer(container);
}

// GSAP Transition timeline for page transitions
function createTransitionTimeline(currentContainer, nextContainer) {
    const insetValue = '40%';

    return gsap.timeline({
        defaults: { ease: "expo.inOut", onComplete: ScrollTrigger.refresh }
    })
        .set(nextContainer, { clipPath: `inset(${insetValue})`, xPercent: 120 })
        .set([currentContainer.querySelector(".section-transition"), nextContainer.querySelector(".section-transition")], { scale: 1, duration: 0.3 })
        .to(currentContainer, { clipPath: `inset(${insetValue})`, duration: 1 })
        .to(currentContainer.querySelector('.section-transition-bg'), { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 0.75 }, "<")
        .to(currentContainer, { xPercent: -120, duration: 1 })
        .set(nextContainer.querySelector('.section-transition-bg'), { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }, "<")
        .to(nextContainer, { xPercent: 0, duration: 1 }, "<")
        .to(nextContainer, { clipPath: `inset(0%)`, duration: 1 })
        .to(nextContainer.querySelector('.section-transition-bg'), { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', ease: 'power2.inOut', duration: 1.1 }, "<")
        .to([nextContainer.querySelector(".section-transition")], { opacity: 0, display: 'hidden', duration: 1 }, ">")
        .set([nextContainer.querySelector(".section-transition")], { opacity: 1, scale: 0 })
        .set(nextContainer, { overflow: "auto", height: "auto", clearProps: "all" });
}

// Barba.js hooks and page transition management
barba.hooks.enter((data) => {
    gsap.set([data.next.container, data.current.container], { position: "fixed", top: 0, left: 0, width: "100%", height: '100vh' });
});

barba.hooks.after((data) => {
    gsap.set(data.next.container, { position: "relative", height: "auto" });
    resetWebflow(data);
    ScrollTrigger.refresh();
});

let musicInstance = null;

// Barba.js initialization
barba.init({
    preventRunning: true,
    views: [
        {
            namespace: "home",
            afterEnter(data) {
                if (firstLoad && !sessionStorage.getItem("firstLoad")) {
                    new Loader(data.next.container);
                    firstLoad = false;
                } else {
                    new Home(data.next.container);
                }
                initializeCommonComponents(data.next.container);
            }
        },
        {
            namespace: "music",
            afterEnter(data) {
                musicInstance = new Music(data.next.container);
                new Nav(data.next.container);
            },
        },
        {
            namespace: "videos",
            afterEnter(data) {
                new Videos(data.next.container);
                new Nav(data.next.container);
            },
        },
        {
            namespace: "film",
            afterEnter(data) {
                new Film(data.next.container);
                new Nav(data.next.container);
            },
        },
        {
            namespace: "time",
            afterEnter(data) {
                new Time(data.next.container, lenis);
                new Nav(data.next.container);
            },
        },
        {
            namespace: "about",
            afterEnter(data) {
                new About(data.next.container);
                initializeCommonComponents(data.next.container);
            },
        },
        {
            namespace: "shop",
            afterEnter(data) {
                new Shop(data.next.container);
                initializeCommonComponents(data.next.container);
            },
        },
        {
            namespace: "product",
            afterEnter(data) {
                new Product(data.next.container);
                initializeCommonComponents(data.next.container);
            },
        },
        {
            namespace: "connect",
            afterEnter(data) {
                initializeCommonComponents(data.next.container);
            },
        },
        {
            namespace: "404",
            afterEnter() {},
        },
    ],
    transitions: [
        {
            sync: true,
            beforeLeave() {
                lenis.start();
                gsap.getTweensOf("*").forEach((animation) => {
                    animation.revert();
                    animation.kill();
                });
                ScrollTrigger.clearScrollMemory();
                ScrollTrigger.getAll().forEach((t) => t.kill());
                ScrollTrigger.refresh();
                musicInstance && musicInstance.stopMusic();
            },
            async enter(data) {
                return createTransitionTimeline(data.current.container, data.next.container);
            }
        }
    ]
});


