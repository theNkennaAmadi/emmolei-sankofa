//import {ctx} from './main.js';
import gsap from 'gsap';
export class Shop{
    //ctx = gsap.context();
    constructor(container){
        this.container = container;
        this.products = [...this.container.querySelectorAll('.merch-collection-item')];
        this.addEventListeners()
    }

    addEventListeners(){
        this.products.forEach(product => {
            let tlProductHover = gsap.timeline({paused: true});
            tlProductHover.to(product.querySelector('.merch-main-visual'), {opacity:0, duration: 0.3})
            tlProductHover.to(product.querySelector('.merch-visual-wrapper'), {opacity:1, duration: 0.3}, "<0.1")


            product.addEventListener('mouseenter', () => {
               tlProductHover.play();
            })
            product.addEventListener('mouseleave', () => {
                tlProductHover.reverse();
            })
        })
    }

}