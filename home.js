import { gsap } from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ColorThief from "colorthief";
import Splitting from "splitting";

gsap.registerPlugin(ScrollTrigger);

export class Home {
    constructor(container) {
        this.container = container;
        this.initElements();
        this.init();
    }

    initElements() {
        const { container } = this;
        this.nameContainerTop = container.querySelector('.name-container-top');
        this.nameContainerBottom = container.querySelector('.name-container-bottom');
        this.nameT1 = this.nameContainerTop.querySelector('.name-block:nth-child(1)');
        this.nameT2 = this.nameContainerTop.querySelector('.name-block:nth-child(2)');
        this.nameB1 = this.nameContainerBottom.querySelector('.name-block:nth-child(1)');
        this.nameB2 = this.nameContainerBottom.querySelector('.name-block:nth-child(2)');
        this.workImages = Array.from(container.querySelectorAll('.h-img'));
        this.colorThief = new ColorThief();
        this.footer = container.querySelector('.footer');
        this.hero = container.querySelector('#homeHero');
        this.homeWorks = container.querySelector('#homeWorks');
        this.homeAbout = container.querySelector('#homeAbout');
        this.questionMark = container.querySelector('.question-mark');
        this.preloaderContent = container.querySelector('.preloader-content');
        this.nameContainer = container.querySelector('.name-container');
        this.mainContent = container.querySelector("main");
        this.headerContent = container.querySelector('header');
    }

    async init() {
        await this.initSplitting();
        await this.getColors();
        this.initScrollAnimation();

        gsap.set('.preloader-wrapper', { display: 'none' });
        gsap.to([this.mainContent, this.headerContent], { opacity: 1 });
        gsap.to('.loader-img', {
            scale: 1,
            clipPath: 'circle(80% at 50% 50%)',
            ease: "expo.out",
            duration: 2
        });
    }

    async initSplitting() {
        const targets = Array.from(this.container.querySelectorAll("[split-text]"));
        const results = Splitting({ target: targets, by: "lines" });

        this.wordsC = this.container.querySelectorAll(".word");
        this.wordsC.forEach((word) => {
            const wrapper = document.createElement("span");
            wrapper.classList.add("char-wrap");
            word.parentNode.insertBefore(wrapper, word);
            wrapper.appendChild(word);
        });

        this.chars = results.flatMap(result => result.chars);
    }

    getTextColor(r, g, b) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 132 ? '#0b0d71' : '#EFE4CF';
    }

    async getColors() {
        const promises = this.workImages.map(async (img) => {
            if (!img.getAttribute('crossorigin')) {
                img.setAttribute('crossorigin', 'anonymous');
                const src = img.src;
                img.src = '';
                img.src = src;
            }
            if (!img.complete) {
                await new Promise(resolve => img.addEventListener('load', resolve));
            }
            const color = this.colorThief.getColor(img);
            const textColor = this.getTextColor(...color);
            const parentElement = img.closest(".home-music-link");
            gsap.set(parentElement, {
                backgroundColor: `rgb(${color.join(',')})`,
                color: textColor
            });
        });
        await Promise.all(promises);
    }

    initScrollAnimation() {
        gsap.set([this.nameT1, this.nameB1], { opacity: 1 });
        gsap.set([this.nameT2, this.nameB2], { opacity: 0 });

        ScrollTrigger.create({
            trigger: this.hero,
            start: "top top",
            endTrigger: this.footer,
            end: "bottom bottom",
            pin: true,
            scrub: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
        });

        const tl = gsap.timeline()
            .to(['.hero-p .word', '.hero-details-wrapper h2'], { yPercent: 120 })
            .to('.loading-visual', { scale: 0 }, "<");

        const tlLeave = gsap.timeline({ paused: true })
            .to(this.questionMark, { opacity: 1 })
            .fromTo(this.container, { color: '#0B8457' }, { color: '#efe5cf' }, "<");

        ScrollTrigger.create({
            trigger: this.homeWorks,
            start: "top bottom",
            end: "top 35%",
            scrub: true,
            invalidateOnRefresh: true,
            animation: tl,
            onLeaveBack: () => gsap.to(this.nameContainer, { filter: 'none' }),
            onEnter: () => gsap.to(this.nameContainer, { filter: 'url(#threshold) blur(0.6px)' }),
            onEnterBack: () => {
                gsap.to(this.nameContainer, { filter: 'url(#threshold) blur(0.6px)' });
                gsap.to(this.questionMark, { opacity: 1 });
                tlLeave.reverse();
            },
            onLeave: () => {
                gsap.to(this.nameContainer, { filter: 'none' });
                tlLeave.play();
            },
            onUpdate: (self) => {
                const progress = self.progress;
                const morphProgress = Math.min(progress, 1);
                const blurAmount1 = morphProgress === 1 ? 100 : Math.min(8 / (1 - morphProgress) - 8, 100);
                const blurAmount2 = morphProgress === 0 ? 100 : Math.min(8 / morphProgress - 8, 100);

                gsap.set([this.nameT1, this.nameB1], {
                    opacity: 1 - morphProgress,
                    filter: `blur(${blurAmount1}px)`
                });
                gsap.set([this.nameT2, this.nameB2], {
                    opacity: morphProgress,
                    filter: `blur(${blurAmount2}px)`
                });
            }
        });

        const tlAbout = gsap.timeline({ paused: true })
            .to(this.questionMark, { scale: 1, fontSize: '35vw' })
            .fromTo(['main', 'header'], { color: 'inherit' }, { color: '#0B8457' }, "<")
            .to(this.preloaderContent, { opacity: 0 }, "<");

        ScrollTrigger.create({
            trigger: this.homeAbout,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
            animation: tlAbout,
        });
    }
}
