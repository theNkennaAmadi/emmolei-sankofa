import { gsap } from "gsap";

export class Film {
    constructor(container) {
        this.container  = container;
        this.filmItems = [...container.querySelectorAll('.film-item')];
        this.filmDetails = [...container.querySelectorAll('.video-content-item')];
        this.videoContentContainer = this.container.querySelector('.videos-c');
        this.backButton = this.container.querySelector('.video-content-back-btn');
        console.log(this.filmItems)
        this.init();
    }
    init() {
        this.revealContent()
    }

    revealContent() {
        this.filmItems.forEach((item, index) => {
            const detail = this.filmDetails[index]
            const tl = gsap.timeline({paused: true});
            tl.set(detail, {opacity: 1, display: 'block', duration: 1, ease: 'expo.out'})
                .to(this.videoContentContainer, {clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out'}, "<")
                .from(detail.querySelector(['h1', 'p']), {yPercent: 100, duration: 0.6, ease: "power2.out"})
                .from(detail.querySelectorAll('[video-container]'), {yPercent: 110,duration: 0.6, ease: "power2.out" }, "<")

            item.addEventListener('click', () => {
                detail.querySelector('video').play();
                detail.querySelector('video').muted = false;
                tl.play();
            });
            this.backButton.addEventListener('click', () => {
                detail.querySelector('video').currentTime = 0;
                detail.querySelector('video').pause();
                detail.querySelector('video').muted = true;
                tl.reverse();
            });
        });
    }

}