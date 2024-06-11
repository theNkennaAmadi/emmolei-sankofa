import gsap from "gsap";
import Splitting from "splitting";

export class Nav{
    constructor(header) {
        this.header = header;
        this.nav = this.header.querySelector('.nav');
        this.navItems = [...this.nav.querySelectorAll('.nav-item')];
        this.navMobileMenu = this.header.querySelector('.nav-mobile-menu');
        this.navLinksWrapper = this.header.querySelector('.nav-links-wrapper');
        this.navLinks = [...this.navLinksWrapper.querySelectorAll('.nav-link')];
        this.init();
    }
    init(){
        this.initSplitting();
        this.hoverAnimation();
        this.showNavMobile();
    }
    initSplitting() {
        //Initialize Splitting, split the text into characters and get the results
        const targets = [...this.header.querySelectorAll(".nav-link-text")];
        const results = Splitting({ target: targets, by: "chars" });

        //Get all the words and wrap each word in a span
        let words = this.header.querySelectorAll(".word");
        words.forEach((word) => {
            let wrapper = document.createElement("span");
            wrapper.classList.add("char-wrap");
            word.parentNode.insertBefore(wrapper, word);
            wrapper.appendChild(word);
        });

        //Get all the characters and move them off the screen
        this.chars = results.map((result) => result.chars);
        //gsap.set(this.chars, { yPercent: 120, opacity: 0 });

        //Group the characters into pairs because we have one for title and one for category, we need this for accurate index
        //this.charGroups = this.groupItems(chars);
    }

    hoverAnimation(){

        this.navLinks.forEach((link) => {
            let text1 = link.querySelector(".nav-link-text:nth-child(1)");
            let text2 = link.querySelector(".nav-link-text:nth-child(2)");

            let tl = gsap.timeline({
                paused: true,
                defaults: {
                    duration: 0.7,
                    ease: "power2.out"
                }
            });
            tl.fromTo(text1.querySelectorAll(".char:nth-child(odd)"), { yPercent: 100 }, { yPercent: 0 });
            tl.fromTo(text2.querySelectorAll(".char:nth-child(odd)"), { yPercent: 0 }, { yPercent: -100 }, 0);
            tl.fromTo(text1.querySelectorAll(".char:nth-child(even)"), { yPercent: 0 }, { yPercent: 100 }, 0);
            tl.fromTo(text2.querySelectorAll(".char:nth-child(even)"), { yPercent: -100 }, { yPercent: 0 }, 0);

            link.addEventListener("mouseenter", () => {
                tl.restart();
            });
        });

    }

    showNavMobile(){
        this.navOpen = false;
        this.tlShowNavMobile = gsap.timeline({paused: true});
        let mm = gsap.matchMedia();

        mm.add("(max-width: 479px)", () => {
            this.tlShowNavMobile.set(this.navLinksWrapper, {display: 'grid'});
            this.tlShowNavMobile.from(this.navLinksWrapper, {clipPath: 'inset(100%)', duration: 0.75});
            this.tlShowNavMobile.to(this.nav.querySelector(".nav-dot.middle"), {opacity: 1, duration: 0.35}, "<");
            this.tlShowNavMobile.to(this.navMobileMenu, {rotate: 180, duration: 0.5}, "<");
        });

        this.navMobileMenu.addEventListener('click', () => {
            this.navOpen ? this.tlShowNavMobile.reverse() : this.tlShowNavMobile.play();
            this.navOpen = !this.navOpen;
        })
    }
}
