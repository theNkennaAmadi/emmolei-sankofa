import { gsap } from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ColorThief from "colorthief";
import Splitting from "splitting";

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.clearScrollMemory();
ScrollTrigger.refresh()

const cleanGSAP = () => {
    ScrollTrigger.getAll().forEach(t => t.kill(false));
    ScrollTrigger.refresh();
    window.dispatchEvent(new Event("resize"));
};


export class Home {
    constructor(container) {
        this.container = container;
        this.nameContainerTop = this.container.querySelector('.name-container-top');
        this.nameContainerBottom = this.container.querySelector('.name-container-bottom');
        this.nameT1 = this.nameContainerTop.querySelector('.name-block:nth-child(1)');
        this.nameT2 = this.nameContainerTop.querySelector('.name-block:nth-child(2)');
        this.nameB1 = this.nameContainerBottom.querySelector('.name-block:nth-child(1)');
        this.nameB2 = this.nameContainerBottom.querySelector('.name-block:nth-child(2)');
        this.workImages = [...this.container.querySelectorAll('.h-img')]
        this.colorThief = new ColorThief();
        this.footer = container.querySelector('.footer');
        this.hero = container.querySelector('#homeHero');
        this.homeWorks = container.querySelector('#homeWorks');
        this.homeAbout = container.querySelector('#homeAbout');
        this.homeBody = container
        this.questionMark = container.querySelector('.question-mark');
        this.preloaderContent = container.querySelector('.preloader-content');
        this.nameContainer = container.querySelector('.name-container');
        ScrollTrigger.refresh()
        this.init();
    }

    init() {
        this.initSplitting();
        this.initScrollAnimation();
        this.getColors();
        gsap.set('.preloader-wrapper', {display: 'none'})
        gsap.to('.loader-img', {scale:1,clipPath: 'circle(80% at 50% 50%)', ease: "expo.out", duration: 2})
    }

    initSplitting() {
        //Initialize Splitting, split the text into characters and get the results
        const targets = [...this.container.querySelectorAll("[split-text]")];
        const results = Splitting({target: targets, by: "lines"});

        //Get all the words and wrap each word in a span
        this.wordsC = this.container.querySelectorAll(".word");
        this.wordsC.forEach((word) => {
            let wrapper = document.createElement("span");
            wrapper.classList.add("char-wrap");
            word.parentNode.insertBefore(wrapper, word);
            wrapper.appendChild(word);
        });

        //Get all the characters and move them off the screen
        this.chars = results.map((result) => result.chars);
        //gsap.set(this.chars, {yPercent: 120});
    }

  getTextColor(r, g, b) {
        // Calculate the brightness of the color
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        // Return white for dark colors and black for light colors
        //console.log(brightness)
        return brightness > 132 ? '#0b0d71' : '#EFE4CF';
    }

    getColors(){
        this.workImages.forEach((img) => {
            img.crossOrigin = "Anonymous";
            new Promise((resolve) => {
                if (img.complete) {
                    resolve(this.colorThief.getColor(img));
                } else {
                    img.addEventListener('load', ()=> {
                        resolve(this.colorThief.getColor(img));
                    });
                }
            }).then(color => {
                const textColor = this.getTextColor(color[0], color[1], color[2]);
                const parentElement = img.closest(".home-music-link");
                gsap.set(parentElement, {backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`});
                gsap.set(parentElement, {color: textColor});
            });
        })
    }

    initScrollAnimation() {
        // Initial states
        this.nameT1.style.opacity = '1';
        this.nameT2.style.opacity = '0';
        this.nameB1.style.opacity = '1';
        this.nameB2.style.opacity = '0';

        ScrollTrigger.create({
            trigger: this.hero,
            start: "top top",
            endTrigger: this.footer,
            end: "bottom bottom",
            pin: true,
            scrub: true,
            pinSpacing: false,
            markers: false,
            invalidateOnRefresh: true,
        });

        let tl =  gsap.timeline()
        tl.to(['.hero-p .word', '.hero-details-wrapper h2'], {yPercent: 120})
        tl.to('.loading-visual', {scale:0}, "<")

        let tlLeave = gsap.timeline({paused: true})
        tlLeave.to(this.questionMark, {opacity: 1})
        tlLeave.fromTo(this.homeBody,{color: '#0B8457'},{color: '#efe5cf'}, "<")


        ScrollTrigger.create({
            trigger: this.homeWorks,
            start: "top bottom",
            end: "top 35%",
            scrub: true,
            invalidateOnRefresh: true,
            animation: tl,
            onLeaveBack: ()=>{
                gsap.to(this.nameContainer,{filter: 'none'})
            },
            onEnter: ()=>{
                gsap.to(this.nameContainer,{filter: 'url(#threshold) blur(0.6px)'})
            },
            onEnterBack: ()=>{
                gsap.to(this.nameContainer,{filter: 'url(#threshold) blur(0.6px)'})
                gsap.to(this.questionMark, {opacity: 1})
                tlLeave.reverse()
            },
            onLeave: ()=>{
                gsap.to(this.nameContainer,{filter: 'none'})
                tlLeave.play()
            },
            onUpdate: (self) => {
                const progress = self.progress;

                // Calculate the morph progress
                const morphProgress = Math.min(progress, 1);

                // Top name morph
                gsap.set(this.nameT1, { opacity: 1 - morphProgress });
                gsap.set(this.nameT2, { opacity: morphProgress });
                gsap.set(this.nameT1, { filter: `blur(${Math.min(8 / (1 - morphProgress) - 8, 100)}px)` });
                gsap.set(this.nameT2, { filter: `blur(${Math.min(8 / morphProgress - 8, 100)}px)` });

                // Bottom name morph
                gsap.set(this.nameB1, { opacity: 1 - morphProgress });
                gsap.set(this.nameB2, { opacity: morphProgress });
                gsap.set(this.nameB1, { filter: `blur(${Math.min(8 / (1 - morphProgress) - 8, 100)}px)` });
                gsap.set(this.nameB2, { filter: `blur(${Math.min(8 / morphProgress - 8, 100)}px)` });
            }
        });

        let tlAbout = gsap.timeline({paused: true})
        tlAbout.to(this.questionMark, {scale: 1, fontSize: '35vw'})
            .fromTo(['main', 'header'],{color: 'inherit'},{color: '#0B8457'}, "<")
            .to(this.preloaderContent, {opacity: 0}, "<")

        ScrollTrigger.create({
            trigger: this.homeAbout,
            start: "top bottom",
            end: "top top",
            markers: false,
            scrub: true,
            invalidateOnRefresh: true,
            animation:tlAbout,
        })
    }
}
