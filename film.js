import { gsap } from "gsap";
import playerjs from "player.js";

export class Film {
    constructor(container) {
        this.container = container;
        this.filmItems = Array.from(container.querySelectorAll('.film-item'));
        this.filmDetails = Array.from(container.querySelectorAll('.video-content-item'));
        this.videoContentContainer = this.container.querySelector('.videos-c');
        this.backButton = this.container.querySelector('.video-content-back-btn');
        this.currentVideo = null;
        this.currentFilmDetail = null;
        this.removeInvisibleElements();
        this.initializeVideos();
        this.setupEventListeners();
    }

    removeInvisibleElements() {
        const invisibleElements = this.container.querySelectorAll('.w-condition-invisible');
        invisibleElements.forEach(element => element.remove());
    }

    initializeVideos() {
        this.filmDetails.forEach((detail, index) => {
            const videoElement = detail.querySelector('video');
            const embedlyIframe = detail.querySelector('iframe.embedly-embed');
            let videoObj = null;

            if (videoElement) {
                videoObj = { element: videoElement, type: 'html5' };
            } else if (embedlyIframe) {
                const player = new playerjs.Player(embedlyIframe);
                videoObj = { element: embedlyIframe, type: 'embedly', player };

                player.on('ready', () => {
                    // Player is ready
                });

                player.on('error', (error) => {
                    console.error(`Error in Embedly player ${index}:`, error);
                });
            }

            detail.video = videoObj;

            // Create GSAP timeline for this detail
            const tl = gsap.timeline({ paused: true });
            tl.set(detail, { opacity: 1, display: 'block', duration: 1, ease: 'expo.out' })
                .to(this.videoContentContainer, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out' }, "<")
                .from(detail.querySelectorAll('h1, p'), { yPercent: 100, duration: 0.6, ease: "power2.out" })
                .from(detail.querySelectorAll('[video-container]'), { yPercent: 110, duration: 0.6, ease: "power2.out" }, "<");

            detail.timeline = tl;
        });
    }

    setupEventListeners() {
        this.filmItems.forEach((item, index) => {
            const detail = this.filmDetails[index];
            item.addEventListener('click', () => {
                if (this.currentVideo) {
                    this.stopVideo(this.currentVideo);
                }
                const video = detail.video;
                if (video) {
                    this.playVideo(video);
                    this.currentVideo = video;
                }
                if (this.currentFilmDetail && this.currentFilmDetail !== detail) {
                    this.currentFilmDetail.timeline.reverse();
                }
                this.currentFilmDetail = detail;
                detail.timeline.play();
            });
        });

        this.backButton.addEventListener('click', () => {
            if (this.currentVideo) {
                this.stopVideo(this.currentVideo);
                this.currentVideo = null;
            }
            if (this.currentFilmDetail) {
                this.currentFilmDetail.timeline.reverse();
                this.currentFilmDetail = null;
            }
        });
    }

    playVideo(video) {
        if (video.type === 'html5') {
            video.element.muted = false;
            video.element.play();
        } else if (video.type === 'embedly' && video.player) {
            video.player.play();
        }
    }

    stopVideo(video) {
        if (video.type === 'html5') {
            video.element.pause();
            video.element.currentTime = 0;
            video.element.muted = true;
        } else if (video.type === 'embedly' && video.player) {
            video.player.pause();
        }
    }
}
