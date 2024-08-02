// import Swiper bundle with all modules installed
import Swiper from 'swiper/bundle';

// import styles bundle
import 'swiper/css/bundle';

console.log('test');

class Time{
    constructor(container){
        this.container = container;
        this.init();
    }

    init(){
        const swiper = new Swiper(".swiper", {
            slidesPerView: 2,
            spaceBetween: 24,
            loop: true,
            centeredSlides: true,
        });
    }

}