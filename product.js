import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';
import gsap from "gsap";

export class Product {
    constructor(container) {
        this.container = container;
        this.faqs = [...this.container.querySelectorAll(".sp-faq-content")];
        this.products = [...this.container.querySelectorAll('.merch-collection-item')];
        this.selectWrappers = [...this.container.querySelectorAll('select')];
        this.init();
    }

    init() {
        this.initSwiper();
        this.initImages();
        this.initSelectListeners();
        this.initFAQ();
        this.addEventListeners();
    }

    initImages() {
        this.productWrapper = this.container.querySelector('.product-wrapper');
        this.productThumbWrapper = this.container.querySelector('.product-thumb-wrapper');

        this.initWrapper = this.container.querySelector('.initial-wrapper');
        this.thumbsWrapper = this.container.querySelector('.is-thumb-hero');
        this.mainSwiperList = this.container.querySelector('.product-list');
        this.thumbSwiperList = this.container.querySelector('.product-thumb-list');
        this.initClone = this.initWrapper.cloneNode(true);
        this.thumbClone = this.thumbsWrapper.cloneNode(true);
        this.mainSwiperList.prepend(this.initClone);
        this.thumbSwiperList.prepend(this.thumbClone);
        gsap.set(this.productWrapper, {opacity: 1});
        gsap.set([this.initWrapper, this.thumbsWrapper], {display: 'none'});
        gsap.set([this.initClone, this.thumbClone], {display: 'block'});
        this.initSwiper();
    }

    initSwiper() {
        const thumbSwiper = new Swiper(this.productThumbWrapper, {
            freeMode: true,
            watchSlidesProgress: true,
        });

        this.swiper = new Swiper(this.productWrapper, {
            direction: "horizontal",
            mousewheel: true,
            keyboard: {
                enabled: true,
            },
            thumbs: {
                swiper: thumbSwiper,
            }
        });
    }

    initSelectListeners() {
        this.selectWrappers.forEach(select => {
            select.addEventListener('change', (event) => {
                const selectedIndex = event.target.selectedIndex;
                if (selectedIndex !== 0) {
                   // console.log('Initializing images for non-first option');
                    this.initImages();
                    gsap.to(this.mainSwiperList, {x:0})
                } else {
                    //console.log('First option selected, not initializing images');
                }
            });
        });
    }

    initFAQ() {
        this.faqs.forEach((faq) => {
            faq.addEventListener("click", () => {
                const answer = faq.querySelector(".sp-faq-answer");
                const accord = faq.querySelector(".accordion-vertical");
                const isActive = faq.classList.contains("active");

                gsap.to(answer, {
                    height: isActive ? 0 : "auto",
                    duration: 0.3
                });
                gsap.to(accord, {
                    scaleY: isActive ? 1 : 0,
                    duration: 0.3
                });

                faq.classList.toggle("active");
            });
        });
    }

    addEventListeners() {
        this.products.forEach(product => {
            const mainVisual = product.querySelector('.merch-main-visual');
            const visualWrapper = product.querySelector('.merch-visual-wrapper');

            const tlProductHover = gsap.timeline({paused: true})
                .to(mainVisual, {opacity: 0, duration: 0.3})
                .to(visualWrapper, {opacity: 1, duration: 0.3}, "<0.1");



            product.addEventListener('mouseenter', () => tlProductHover.play());
            product.addEventListener('mouseleave', () => tlProductHover.reverse());
        });
    }
}