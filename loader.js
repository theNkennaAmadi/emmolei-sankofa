import gsap from 'gsap';
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrambleTextPlugin)

class Loader {

    tlAnimateDots = gsap.timeline();
    tlReavealVisual = gsap.timeline({defaults: {duration: 1}});
    constructor(container){
        this.container = container;
        this.loaderWrapper = document.querySelector(".preloader-wrapper");
        this.loadingDots = [...this.loaderWrapper.querySelectorAll('.loading-visual')]
        this.loadingTextWrapper = this.loaderWrapper.querySelector('.loading-text-wrapper')
        this.init()
        this.addEventListeners()
    }

    init(){
        this.animateDots();
    }

    animateDots(){
        this.tlAnimateDots.to(this.loadingTextWrapper.querySelector("*"), {opacity: 0.5, duration: 0.6, yoyo: true, repeat: -1}, "")
        this.tlAnimateDots.to(this.loadingDots, {
            scale: 1,
            borderRadius: "0%",
            duration: 1,
            ease: "expo.inOut",
            stagger: {
                amount: 2,
                from: "end",
            },
            delay: 0.5
        }, "<")
        this.tlAnimateDots.to(".loading-text", {
            duration: 1,
            scrambleText: {
                text: "CLICK TO ENTER",
                chars: "O",
                speed: 1,
            }
        });

    }

    addEventListeners(){
        this.loaderWrapper.addEventListener('click', () => {
            this.tlReavealVisual.to(this.loadingDots[2], {height: '100%', scaleX: 0.5, ease: "expo.out"})
            this.tlReavealVisual.from(".loading-visual-wrapper.home", {height: '100%', ease: "expo.out"})
            this.tlReavealVisual.to([this.loadingDots[0], this.loadingDots[1], this.loadingDots[3], this.loadingDots[4]], {height: '0%'}, "<")
            this.tlReavealVisual.to(this.loaderWrapper, {backgroundColor:'transparent',color: 'black'}, "<")
            this.tlReavealVisual.to(this.loadingTextWrapper, {opacity:0, duration: 0.3}, "<")
            this.tlReavealVisual.set(this.loaderWrapper, { display: 'none'}, ">")
            this.tlReavealVisual.fromTo('.loader-img',{scale:1.6, clipPath: 'circle(0% at 50% 50%)'}, {scale:1,clipPath: 'circle(80% at 50% 50%)', ease: "expo.out", duration: 2}, ">0.2")
        });
    }
}

export default Loader;