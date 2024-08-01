import Swiper from 'swiper/bundle';
// import Swiper and modules styles
import 'swiper/css/bundle';
import gsap from "gsap";

export class Product {
  constructor(container) {
      this.container = container
      this.faqs = [...this.container.querySelectorAll(".sp-faq-content")];
      this.products = [...this.container.querySelectorAll('.merch-collection-item')];
      this.init();
  }

  init() {
    this.initSwiper();
    this.initFAQ();
      this.addEventListeners()
  }

  initSwiper() {


      const swiper = new Swiper(".product-thumb-wrapper", {
          freeMode: true,
          watchSlidesProgress: true,
      });
      const swiper2 = new Swiper(".product-wrapper", {
          direction: "horizontal",
          mousewheel: true,
          keyboard: {
              enabled: true,
          },
          thumbs: {
              swiper: swiper,
          },
          breakpoints: {
              // when window width is >= 320px
              480: {
                  direction: "horizontal",
                  pagination: {
                      el: ".swiper-pagination",
                  },
              }
          }
      });


  }
  initFAQ(){
      let tlFAQ = gsap.timeline();
      this.faqs.map((faq) => {
          faq.addEventListener("click", (e) => {
              let answer = faq.querySelector(".sp-faq-answer");
              let accord = faq.querySelector(".accordion-vertical");
              if (!faq.classList.contains("active")) {
                  tlFAQ.to(answer, {
                      height: "auto"
                  });
                  tlFAQ.to(
                      accord,
                      {
                          scaleY: 0
                      },
                      "<"
                  );
                  faq.classList.add("active");
              } else {
                  tlFAQ.to(answer, {
                      height: 0
                  });
                  tlFAQ.to(
                      accord,
                      {
                          scaleY: 1
                      },
                      "<"
                  );
                  faq.classList.remove("active");
              }
          });
      });
  }
    addEventListeners(){
        this.products.forEach(product => {
            let tlProductHover = gsap.timeline({paused: true});
            tlProductHover.to(product.querySelector('.merch-visual-item:nth-child(1)'), {opacity:0, duration: 0.3})
            tlProductHover.to(product.querySelector('.merch-visual-item:nth-child(2)'), {opacity:1, duration: 0.3}, "<0.1")


            product.addEventListener('mouseenter', () => {
                tlProductHover.play();
            })
            product.addEventListener('mouseleave', () => {
                tlProductHover.reverse();
            })
        })
    }
}
