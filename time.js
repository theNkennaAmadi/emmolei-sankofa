import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import CustomEase from 'gsap/CustomEase';
import * as htmx from 'htmx.org';

gsap.registerPlugin(ScrollToPlugin, CustomEase, ScrollTrigger);
CustomEase.create('cubic', '.83,0,.17,1');

export default class Time {
    constructor(container, lenis) {
        this.initStartTime = performance.now();
       // console.log('Time initialization started');
        this.container = container;
        this.lenis = lenis;
        this.timeBody = container.closest('body');
        this.canvasContainer = container.querySelector('.canvas-container');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.buttons = container.querySelectorAll('.t-button');
        this.timeItems = document.querySelectorAll('.time-item');

        this.imagePlanes = [];
        this.totalHeight = 30;
        this.radius = 14;
        this.timeDetails = this.createTimeDetails();
        this.imageData = this.createImageData();
        this.spacing = this.imageData.length * (2.4 / this.imageData.length);
        this.futureButton = this.container.querySelector('#futureBtn');
        this.presentButton = this.container.querySelector('#presentBtn');
        this.pastButton = this.container.querySelector('#pastBtn');

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Initialize touch variables
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touching = false;
        this.touchMoved = false;
        this.isHorizontalScroll = false;

        this.init();
    }

    createTimeDetails() {
        const timeItems = this.container.querySelectorAll('.time-item');
        const placeholderSrc =
            'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg';
        const defaultImage =
            'https://uploads-ssl.webflow.com/6634c23145c0a86a4c0bda23/669809a3d62ea03f04364464_nothing.webp';

        return Array.from(timeItems).map((item, index) => {
            const imgElement = item.querySelector('.time-main-img');
            let imgSrc = imgElement?.src;

            if (imgSrc === placeholderSrc) {
                imgSrc = defaultImage;
            }

            return {
                name: item.getAttribute('data-name'),
                date: new Date(item.getAttribute('data-date')),
                url: imgSrc || defaultImage,
                id: `${index}-${item.getAttribute('data-name')}`,
            };
        });
    }

    createImageData() {
        const today = new Date();
        const currentYear = today.getFullYear();

        const futureItems = this.timeDetails.filter((item) => item.date > today);
        const currentYearItems = this.timeDetails.filter(
            (item) => item.date.getFullYear() === currentYear
        );
        const pastItems = this.timeDetails.filter(
            (item) => item.date < today && item.date.getFullYear() < currentYear
        );

        this.defaultImage =
            'https://uploads-ssl.webflow.com/6634c23145c0a86a4c0bda23/669809a3d62ea03f04364464_nothing.webp';
        this.futureURL =
            'https://uploads-ssl.webflow.com/6634c23145c0a86a4c0bda23/66ab8cf2b1434ac19b0be4ab_future.webp';
        this.presentURL =
            'https://uploads-ssl.webflow.com/6634c23145c0a86a4c0bda23/66ab8cf2fcef5c0a8e1b5d99_present.webp';
        this.pastURL =
            'https://uploads-ssl.webflow.com/6634c23145c0a86a4c0bda23/66ab8cf2550bde50549193c5_past.webp';

        return [
            { id: 'future', url: this.futureURL },
            ...(futureItems.length > 0
                ? futureItems
                : [{ id: 'default-future', url: this.defaultImage }]),
            { id: 'present', url: this.presentURL },
            ...(currentYearItems.length > 0
                ? currentYearItems
                : [{ id: 'default-present', url: this.defaultImage }]),
            { id: 'past', url: this.pastURL },
            ...(pastItems.length > 0
                ? pastItems
                : [{ id: 'default-past', url: this.defaultImage }]),
        ];
    }

    init() {
        const initStartTime = performance.now();
        gsap.fromTo(
            this.canvasContainer,
            { opacity: 0 },
            { opacity: 1, duration: 0.8, ease: 'expo.in' }
        );
        this.setupRenderer();
        this.createImagePlanes();
        this.setupCamera();
        this.setupResizeListener();
        this.setupButtonListeners();
        this.setupRaycaster();

        gsap.to(this.buttons, { opacity: 1, duration: 1.25, ease: 'expo.in' });
        gsap.fromTo(
            '.sm-dot',
            { opacity: 0, yPercent: 50 },
            {
                opacity: 1,
                yPercent: 0,
                duration: 1,
                stagger: {
                    amount: 1,
                    from: 'center',
                },
                ease: 'expo.in',
                delay: 0.5,
            }
        );

        this.animate();

        this.timeItems.forEach((item) => {
            this.setupHtmx(item);
        });

        this.initializeVideoEmbeds();

        // Log total initialization time
        const totalInitTime = performance.now() - this.initStartTime;
       // console.log(`Total Time initialization completed in ${totalInitTime.toFixed(2)}ms`);
    }

    setupHtmx(item) {
        const slug = item.getAttribute('data-slug');
        const contentBlock = item.querySelector('.time-content-block');

        if (!slug || !contentBlock) return;

        contentBlock.setAttribute('hx-get', `/time/${slug}`);
        contentBlock.setAttribute('hx-trigger', 'load');
        contentBlock.setAttribute('hx-target', 'this');
        contentBlock.setAttribute('hx-select', `.time-vis-list`);
        contentBlock.setAttribute('hx-swap', 'outerHTML');
        htmx.process(contentBlock);
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xffffff, 0);
        this.canvasContainer.appendChild(this.renderer.domElement);
    }

    createImagePlanes() {
        const textureLoader = new THREE.TextureLoader();
        const loadTexture = (imageData) => {
            return new Promise((resolve) => {
                textureLoader.load(imageData.url, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.format = THREE.RGBAFormat;
                    texture.generateMipmaps = false;
                    resolve({ texture, imageData });
                });
            });
        };

        const createPlane = ({ texture, imageData }, index) => {
            const imageAspect = texture.image.width / texture.image.height;
            const planeHeight = 2.5;
            const planeWidth = planeHeight * imageAspect;

            const trans = ['future', 'present', 'past'].includes(imageData.id);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: trans,
            });
            const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
            const mesh = new THREE.Mesh(geometry, material);

            mesh.userData = {
                id: imageData.id,
                date: imageData.date,
                name: imageData.name,
            };

            const yPos = index * this.spacing;
            mesh.position.set(
                this.radius * Math.sin((yPos / this.totalHeight) * Math.PI * 2),
                yPos,
                this.radius * Math.cos((yPos / this.totalHeight) * Math.PI * 2)
            );
            mesh.rotation.y = Math.PI / 90;

            this.scene.add(mesh);
            this.imagePlanes.push(mesh);
        };

        return Promise.all(this.imageData.map(loadTexture)).then(
            (texturesWithData) => {
                texturesWithData.forEach((item, index) => createPlane(item, index));
                this.setupInitialPositions();
                this.animateInitialPositions();
            }
        );
    }

    setupCamera() {
        this.camera.position.set(0, 0, 20);
    }

    setupInitialPositions() {
        this.imagePlanes.forEach((plane, index) => {
            const yPos = index * this.spacing + this.totalHeight;
            plane.position.set(
                this.radius * Math.sin((yPos / this.totalHeight) * Math.PI * 2),
                yPos,
                this.radius * Math.cos((yPos / this.totalHeight) * Math.PI * 2)
            );
            plane.material.opacity = 0;
        });
    }

    animateInitialPositions() {
        const duration = 2.5;
        const tl = gsap.timeline({
            onComplete: () => {
                this.setupScrollAnimation();
            },
        });

        tl.to(
            {},
            {
                duration: duration,
                onUpdate: () => {
                    const progress = tl.progress();
                    const scrollY = (1 - progress) * this.totalHeight * 2;

                    this.imagePlanes.forEach((plane, index) => {
                        const yPos = index * this.spacing - scrollY;
                        const xPos =
                            this.radius * Math.sin((yPos / this.totalHeight) * Math.PI * 2);
                        const zPos =
                            this.radius * Math.cos((yPos / this.totalHeight) * Math.PI * 2);
                        gsap.to(plane.position, {
                            y: yPos,
                            x: xPos,
                            z: zPos,
                        });

                        const normalizedY = (yPos + this.totalHeight / 2) / this.totalHeight;
                        gsap.to(plane.material, {
                            opacity: Math.max(
                                0,
                                Math.min(1, 1 - Math.abs(normalizedY - 0.5) * 2)
                            ),
                        });
                    });

                    this.renderer.render(this.scene, this.camera);
                },
                ease: 'expo.inOut',
            }
        );
    }

    setupScrollAnimation() {
        const totalLength = this.imageData.length * 10;
        let lastLoggedYear = null;
        const today = new Date();
        const yearElement = this.container.querySelector('.time-year');
        yearElement.textContent = `${today.getFullYear()}`;

        gsap.to(yearElement, { duration: 0.5, opacity: 1, ease: 'expo.in' });

        const updatePositions = () => {
            const scrollY = (window.scrollY / window.innerHeight) * this.totalHeight;
            const centerIndex = Math.round(scrollY / this.spacing);

            if (centerIndex >= 0 && centerIndex < this.imagePlanes.length) {
                const centerPlane = this.imagePlanes[centerIndex];
                const { date, name } = centerPlane.userData;

                if (name !== 'Default') {
                    if (date && date.getFullYear() !== lastLoggedYear) {
                        yearElement.textContent = date.getFullYear();
                        lastLoggedYear = date.getFullYear();
                    } else if (['Future', 'Present', 'Past'].includes(name)) {
                        yearElement.textContent = name.toUpperCase();
                        lastLoggedYear = null;
                    }
                }
            }

            this.imagePlanes.forEach((plane, index) => {
                const yPos = index * this.spacing - scrollY;
                plane.position.y = yPos;
                plane.position.x =
                    this.radius * Math.sin((yPos / this.totalHeight) * Math.PI * 2);
                plane.position.z =
                    this.radius * Math.cos((yPos / this.totalHeight) * Math.PI * 2);

                const normalizedY = (yPos + this.totalHeight / 2) / this.totalHeight;
                plane.material.opacity = Math.max(
                    0,
                    Math.min(1, 1 - Math.abs(normalizedY - 0.5) * 2)
                );
            });
        };

        ScrollTrigger.create({
            trigger: this.timeBody,
            start: 'top top',
            end: `+=${totalLength}%`,
            scrub: true,
            pin: true,
            onUpdate: updatePositions,
        });
    }

    setupResizeListener() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupButtonListeners() {
        this.futureButton.addEventListener('click', () =>
            this.scrollToImage('future')
        );
        this.presentButton.addEventListener('click', () =>
            this.scrollToImage('present')
        );
        this.pastButton.addEventListener('click', () =>
            this.scrollToImage('past')
        );
        this.container
            .querySelector('.time-back-btn')
            .addEventListener('click', () => {
                this.tlShow.reverse();
                this.stopAllVideos();
                this.lenis.start();
            });
    }

    initializeVideoEmbeds() {
        // Initialize YouTube iframes
        const youtubeIframes = this.container.querySelectorAll(
            'iframe[src*="youtube.com"]'
        );
        youtubeIframes.forEach((iframe) => {
            let src = new URL(iframe.src);
            if (!src.searchParams.has('enablejsapi')) {
                src.searchParams.append('enablejsapi', '1');
                iframe.src = src.toString();
            }
        });

        // Initialize Vimeo iframes
        const vimeoIframes = this.container.querySelectorAll(
            'iframe[src*="vimeo.com"]'
        );
        vimeoIframes.forEach((iframe) => {
            let src = new URL(iframe.src);
            if (!src.searchParams.has('api')) {
                src.searchParams.append('api', '1');
                iframe.src = src.toString();
            }
        });
    }

    stopAllVideos() {
        // Stop HTML5 video elements
        const videoElements = this.container.querySelectorAll('video');
        videoElements.forEach((video) => {
            video.pause();
            video.currentTime = 0;
        });

        // Stop YouTube iframes
        const youtubeIframes = this.container.querySelectorAll(
            'iframe[src*="youtube.com"]'
        );
        youtubeIframes.forEach((iframe) => {
            iframe.contentWindow.postMessage(
                '{"event":"command","func":"pauseVideo","args":""}',
                '*'
            );
        });

        // Stop Vimeo iframes
        const vimeoIframes = this.container.querySelectorAll(
            'iframe[src*="vimeo.com"]'
        );
        vimeoIframes.forEach((iframe) => {
            iframe.contentWindow.postMessage('{"method":"pause"}', '*');
        });
    }

    scrollToImage(id) {
        const index = this.imagePlanes.findIndex((plane) => plane.userData.id === id);
        if (index !== -1) {
            const yPos = index * this.spacing;
            const newScrollPosition =
                (yPos * window.innerHeight) / this.totalHeight;
            const currentScrollPosition = window.scrollY;
            gsap.fromTo(
                window,
                {
                    scrollTo: { y: currentScrollPosition },
                },
                {
                    duration: 2,
                    scrollTo: { y: newScrollPosition },
                    ease: 'power2',
                }
            );
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }

    setupRaycaster() {
        this.canvasContainer.addEventListener(
            'mousemove',
            this.onMouseMove.bind(this),
            false
        );
        this.canvasContainer.addEventListener(
            'click',
            this.onClick.bind(this),
            false
        );

        // Add touch event listeners
        this.canvasContainer.addEventListener(
            'touchstart',
            this.onTouchStart.bind(this),
            false
        );
        this.canvasContainer.addEventListener(
            'touchmove',
            this.onTouchMove.bind(this),
            false
        );
        this.canvasContainer.addEventListener(
            'touchend',
            this.onTouchEnd.bind(this),
            false
        );
    }

    // Touch event handlers
    onTouchStart(event) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.touching = true;
        this.touchMoved = false;
        this.isHorizontalScroll = false;
    }

    onTouchMove(event) {
        if (!this.touching) return;

        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;

        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;

        if (!this.touchMoved) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Movement is horizontal
                this.touchMoved = true;
                this.isHorizontalScroll = true;
                event.preventDefault(); // Prevent default scrolling behavior
            } else {
                // Movement is vertical, allow default behavior
                this.touching = false;
                return;
            }
        }

        if (this.isHorizontalScroll) {
            event.preventDefault(); // Prevent default scrolling behavior
            this.touchStartX = touchX;

            const scrollDelta = -deltaX * 2; // Adjust the multiplier to control sensitivity

            // Use lenis to scroll smoothly
            const currentScroll = this.lenis.scroll;
            const newScroll = currentScroll + scrollDelta;

            this.lenis.scrollTo(newScroll, { immediate: true });
        }
    }

    onTouchEnd(event) {
        this.touching = false;
        this.touchMoved = false;
        this.isHorizontalScroll = false;
    }

    onMouseMove(event) {
        this.updateMousePosition(event);
        this.checkIntersection();
    }

    onClick(event) {
        this.updateMousePosition(event);
        this.checkIntersection(true);
    }

    updateMousePosition(event) {
        const rect = this.canvasContainer.getBoundingClientRect();
        this.mouse.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    checkIntersection(isClick = false) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.imagePlanes);

        let hoveredOverSpecialImage = false;

        for (let intersect of intersects) {
            const plane = intersect.object;
            if (plane.material.opacity > 0.1) {
                const { id, name } = plane.userData;
                if (isClick) {
                    if (name && name !== 'Default') {
                        this.tlShow = gsap.timeline();
                        this.tlShow
                            .to(`[data-name='${CSS.escape(name)}']`, {
                                display: 'grid',
                                zIndex: 3,
                                duration: 0.5,
                                ease: 'expo.out',
                            })
                            .to(
                                '.time-main-wrapper',
                                {
                                    clipPath: 'inset(0% 0% 0% 0%)',
                                    duration: 1,
                                    ease: 'expo.out',
                                },
                                '<'
                            );
                        this.lenis.stop();
                    }
                } else if (
                    ![
                        'future',
                        'present',
                        'past',
                        'default-future',
                        'default-present',
                        'default-past',
                    ].includes(id)
                ) {
                    gsap.to(this.container, { cursor: 'pointer', duration: 0.1 });
                    hoveredOverSpecialImage = true;
                }
                break;
            }
        }

        if (!hoveredOverSpecialImage) {
            gsap.to(this.container, { cursor: 'default', duration: 0.1 });
        }
    }
}
