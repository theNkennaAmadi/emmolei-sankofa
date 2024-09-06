import { gsap } from "gsap";
import playerjs from "player.js";

export class Film {
    constructor(container) {
        this.container = container;
        this.filmItems = [...container.querySelectorAll('.film-item')];
        this.filmDetails = [...container.querySelectorAll('.video-content-item')];
        this.videoContentContainer = this.container.querySelector('.videos-c');
        this.backButton = this.container.querySelector('.video-content-back-btn');
        this.videos = new Map(); // Map to store video objects
        this.currentVideo = null; // To keep track of the currently playing video
        this.removeInvisibleElements();
        this.init();
    }

    init() {
        this.initializeVideos();
        this.revealContent();
    }

    removeInvisibleElements() {
        const invisibleElements = this.container.querySelectorAll('.w-condition-invisible');
        invisibleElements.forEach(element => {
            element.remove();
        });
    }

    revealContent() {
        this.filmItems.forEach((item, index) => {
            const detail = this.filmDetails[index];
            const tl = gsap.timeline({paused: true});
            tl.set(detail, {opacity: 1, display: 'block', duration: 1, ease: 'expo.out'})
                .to(this.videoContentContainer, {clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out'}, "<")
                .from(detail.querySelector(['h1', 'p']), {yPercent: 100, duration: 0.6, ease: "power2.out"})
                .from(detail.querySelectorAll('[video-container]'), {yPercent: 110, duration: 0.6, ease: "power2.out" }, "<");

            item.addEventListener('click', () => {
                if (this.currentVideo) {
                    this.stopVideo(this.currentVideo);
                }
                const video = this.videos.get(`video-${index}`);
                if (video) {
                    this.playVideo(video);
                    this.currentVideo = video;
                }
                tl.play();
            });

            this.backButton.addEventListener('click', () => {
                if (this.currentVideo) {
                    this.stopVideo(this.currentVideo);
                    this.currentVideo = null;
                }
                tl.reverse();
            });
        });
    }

    initializeVideos() {
        this.filmDetails.forEach((detail, index) => {
            const videoElement = detail.querySelector('video');
            const embedlyIframe = detail.querySelector('iframe.embedly-embed');

            if (videoElement) {
                this.videos.set(`video-${index}`, {
                    element: videoElement,
                    type: 'html5'
                });
            } else if (embedlyIframe) {
                const player = new playerjs.Player(embedlyIframe);
                this.videos.set(`video-${index}`, {
                    element: embedlyIframe,
                    type: 'embedly',
                    player: player
                });

                player.on('ready', () => {
                   // console.log(`Embedly player ${index} is ready`);
                });

                player.on('error', (error) => {
                   // console.error(`Error in Embedly player ${index}:`, error);
                });
            }
        });
    }

    playVideo(video) {
        if (video.type === 'html5') {
            video.element.play()
            video.element.muted = false;
        } else if (video.type === 'embedly' && video.player) {
            video.player.play()
        }
    }

    stopVideo(video) {
        if (video.type === 'html5') {
            video.element.pause();
            video.element.currentTime = 0;
            video.element.muted = true;
        } else if (video.type === 'embedly' && video.player) {
            video.player.pause()
        }
    }
}