import Splitting from "splitting";
import { gsap } from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Plyr from 'plyr';

const player = new Plyr('#player');
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.clearScrollMemory()
ScrollTrigger.refresh();

export class About{
    constructor(container) {
        this.container = container
        this.videoButton = this.container.querySelector('.e-about-cta')
        this.videoPoster = this.container.querySelector('.e-about-main')
        this.init()
    }
    init(){
        gsap.to('.main.ab',{opacity: 1, duration: 0.5} )
        this.initSplitting()
        this.displayVideo()
    }
    initSplitting() {
        //Initialize Splitting, split the text into characters and get the results
        const targets = [...this.container.querySelectorAll("[split-text]")];
        //console.log(targets)
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
        this.words = results.map((result) => result.words);
        gsap.set([this.words, '[n-show]'], {yPercent: 120});
        this.showText()
    }

    showText(){
        const words = [...document.querySelectorAll('.word'), ...document.querySelectorAll('[n-show]')]

        words.forEach(word=>{
            gsap.to(word, {
                yPercent: 0,
                scrollTrigger: {
                    trigger: word,
                    invalidateOnRefresh: true,
                    start: 'top 98%',
                    duration: 2,
                    ease: 'expo.out',
                }
            })
        })

        let abChars = document.querySelector('.about-end-quote-wrapper').querySelectorAll('.word')

        gsap.from(abChars, {
            filter: 'blur(80px)',
            autoAlpha: 0,
            stagger: {
                amount: 3
            },
            scrollTrigger: {
                trigger: document.querySelector('.about-end-quote-wrapper')
            }
        })
    }


    displayVideo(){
        this.videoTl = gsap.timeline({paused:true})
        this.videoTl.to(this.videoPoster.querySelectorAll('.word'), {
            yPercent: 120,
            duration: 0.6,
            stagger:{
                amount: 0.1,
                from: 'end'
            }
        })
            .to(this.videoPoster.querySelector('[n-show]'),{
                yPercent: 120,
                duration: 0.6
            }, "<")
            .fromTo(this.videoPoster,{clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'},
                {clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', duration: 0.6, onComplete: ()=>{
                        this.videoPoster.querySelector('video').pause()
                    }}, "<0.4")

        this.videoButton.addEventListener('click', ()=>{
            this.videoTl.play()
            player.play()
        })
    }
}
