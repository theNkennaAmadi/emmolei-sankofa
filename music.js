import { gsap } from "gsap";
import CustomEase from "gsap/CustomEase";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import ColorThief from "colorthief";
import { Howl } from 'howler';
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(CustomEase, MorphSVGPlugin, ScrambleTextPlugin);
CustomEase.create("cubic", ".83,0,.17,1");

const shape1 = 'M16.38 0C7.33868 0 0 7.33868 0 16.38C0 25.4214 7.33868 32.76 16.38 32.76C25.4214 32.76 32.76 25.4214 32.76 16.38C32.76 7.33868 25.4214 0 16.38 0ZM16.38 0.84C24.9669 0.84 31.92 7.79308 31.92 16.38C31.92 24.9669 24.9669 31.92 16.38 31.92C7.79308 31.92 0.84 24.9669 0.84 16.38C0.84 7.79308 7.79308 0.84 16.38 0.84ZM11.76 8.81998V23.94L24.36 16.38L18.06 12.6L11.76 8.81998Z';
const shape2 = 'M16.38 0.740021C7.33868 0.740021 0 8.0787 0 17.12C0 26.1614 7.33868 33.5 16.38 33.5C25.4214 33.5 32.76 26.1614 32.76 17.12C32.76 8.0787 25.4214 0.740021 16.38 0.740021ZM16.38 1.58002C24.9669 1.58002 31.92 8.5331 31.92 17.12C31.92 25.7069 24.9669 32.66 16.38 32.66C7.79308 32.66 0.84 25.7069 0.84 17.12C0.84 8.5331 7.79308 1.58002 16.38 1.58002ZM11.76 12.74V22.74H21V12.74H11.76Z';

export class Music {
    constructor(container) {
        this.container = container;
        this.albumTracks = [];
        this.tlAnimation = null;
        this.visibleCardsCount = 8;
        this.colorThief = new ColorThief();
        this.cards = [...this.container.querySelectorAll(".music-cc-item")];
        this.workImages = [...this.container.querySelectorAll('.h-img')];
        this.isAnimating = false;
        this.slider = container.querySelector(".music-cc-list");
        this.currentTrackIndex = 0;
        this.currentCard = null;
        this.currentHowl = null;
        this.updateInterval = null;
        this.currentAlbum = null;
        this.trackName = container.querySelector('#track-name');
        this.init();
    }

    async init() {
        await this.getColors();
        this.initCards();
        await this.loadTracks();
        this.addEventListeners();
    }

    getTextColor(r, g, b) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? 'black' : 'white';
    }

    async getColors() {
        await Promise.all(this.workImages.map(async (img) => {
            if (!img.getAttribute('crossorigin')) {
                img.setAttribute('crossorigin', 'anonymous');
                const src = img.src;
                img.src = '';
                img.src = src;
            }
            if (!img.complete) {
                await new Promise(resolve => img.addEventListener('load', resolve));
            }
            const color = this.colorThief.getColor(img);
            const textColor = this.getTextColor(...color);
            const parentElement = img.closest(".music-cc-item");
            gsap.set(parentElement, { backgroundColor: `rgb(${color.join(',')})`, color: textColor });
        }));
    }

    initCards() {
        const cards = [...this.slider.querySelectorAll(".music-cc-item")];
        const totalCards = cards.length;
        const visibleCards = this.visibleCardsCount;

        gsap.set(this.slider, { opacity: 1 });

        gsap.to(cards, {
            y: (i) => (i >= totalCards - visibleCards) ? `${30 - ((totalCards - 1 - i) * 5)}%` : "-5%",
            z: (i) => (i >= totalCards - visibleCards) ? 70 - ((totalCards - 1 - i) * 10) : 0,
            opacity: (i) => (i >= totalCards - visibleCards - 4 ? 1 : 0),
            duration: 0.7,
        });
    }

    animateCards(direction) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const cards = [...this.slider.querySelectorAll(".music-cc-item")];
        const totalCards = cards.length;
        const visibleCards = this.visibleCardsCount;

        gsap.to('.player-info', { opacity: 0, duration: 0.2 });

        if (direction === "next") {
            const lastCard = cards.pop();

            gsap.timeline({ onComplete: () => (this.isAnimating = false) })
                .to(lastCard, {
                    y: "185%",
                    duration: 0.5,
                    onComplete: () => {
                        this.slider.prepend(lastCard);
                        this.updateCardPositions([...this.slider.querySelectorAll(".music-cc-item")], totalCards, visibleCards);
                    }
                });
        } else if (direction === "prev") {
            const firstCard = cards.shift();

            gsap.timeline({ onComplete: () => (this.isAnimating = false) })
                .set(firstCard, {
                    y: "150%",
                    z: 70,
                    onComplete: () => {
                        this.slider.append(firstCard);
                        this.updateCardPositions([...this.slider.querySelectorAll(".music-cc-item")], totalCards, visibleCards);
                    }
                });
        }
    }

    updateCardPositions(cards, totalCards, visibleCards) {
        gsap.to(cards, {
            y: (i) => (i >= totalCards - visibleCards) ? `${30 - ((totalCards - 1 - i) * 5)}%` : "-5%",
            z: (i) => (i >= totalCards - visibleCards) ? 70 - ((totalCards - 1 - i) * 10) : 0,
            opacity: (i) => (i >= totalCards - visibleCards - 4 ? 1 : 0),
            duration: 0.75,
            ease: "cubic",
        });
    }

    addEventListeners() {
        const nextButton = this.container.querySelector(".next-button");
        const prevButton = this.container.querySelector(".prev-button");

        nextButton.addEventListener("click", () => this.animateCards('next'));
        prevButton.addEventListener("click", () => this.animateCards('prev'));

        this.cards.forEach((card) => {
            card.querySelector('.n-button').addEventListener('click', () => this.animateCardsToSamePosition());

            card.addEventListener('click', (event) => {
                const target = event.target;
                if (target.closest('.track-item')) {
                    const trackItem = target.closest('.track-item');
                    const index = [...card.querySelectorAll('.track-item')].indexOf(trackItem);
                    this.playTrack(trackItem.dataset.url, index, card);
                    this.animateCardsToSamePosition();
                } else if (target.closest('.previous-icon')) {
                    this.playPreviousTrack();
                } else if (target.closest('.play-icon')) {
                    this.togglePlayPause(card);
                } else if (target.closest('.next-icon')) {
                    this.playNextTrack();
                }
            });
        });
    }

    animateCardsToSamePosition() {
        const cards = [...this.slider.querySelectorAll(".music-cc-item")];
        this.tlAnimation = gsap.timeline()
            .to(cards, { y: 0, z: 0, duration: 1, ease: "cubic" })
            .to('.music-view', { opacity: 0, display: 'none', duration: 0.3 }, "<")
            .to('.music-tracks', { height: '100%', duration: 0.5 }, ">")
            .to('.music-duration', { height: '100%', duration: 0.3 }, "<");
    }

    async loadTracks() {
        try {
            const responses = await Promise.all(this.cards.map((card) =>
                fetch(card.dataset.url, { headers: { 'Content-Type': 'application/json' } })
            ));

            const datas = await Promise.all(responses.map(response => response.json()));

            datas.forEach(data => this.albumTracks.push(data.data));

            this.addTracks();
        } catch (error) {
            console.error('Error fetching track:', error);
        }
    }

    addTracks() {
        this.albumTracks.forEach((album, albumIndex) => {
            const fragment = document.createDocumentFragment();
            album.forEach((track, trackIndex) => {
                const trackItem = document.createElement('div');
                trackItem.classList.add('track-item');
                trackItem.dataset.url = track['optimized_audio']['cloudfront_url'];

                const trackNumberElement = document.createElement('p');
                trackNumberElement.textContent = String(trackIndex + 1).padStart(2, '0');
                trackItem.appendChild(trackNumberElement);

                const nameElement = document.createElement('p');
                nameElement.textContent = track['optimized_audio']['name'];
                trackItem.appendChild(nameElement);

                fragment.appendChild(trackItem);
            });
            this.cards[albumIndex].querySelector('.music-tracks').appendChild(fragment);
        });
    }

    playTrack(url, index, card) {
        if (this.currentHowl) {
            this.currentHowl.stop();
            clearInterval(this.updateInterval);
        }

        this.currentTrackIndex = index;
        this.currentCard = card;
        this.currentAlbum = card;
        const name = card.querySelector(`.track-item:nth-of-type(${index + 1}) p:nth-of-type(2)`).textContent;

        gsap.to('.player-info', { opacity: 1, duration: 0.5 });
        gsap.to(this.trackName, {
            duration: 1,
            scrambleText: { text: name, chars: "O", speed: 1 }
        });

        this.currentHowl = new Howl({
            src: [url],
            autoplay: true,
            html5: true,
            onplay: () => {
                this.updateTrackInfo(card);
                this.animatePlayIcon(card, true);
            },
            onend: () => {
                this.playNextTrack();
                this.animatePlayIcon(card, false);
            }
        });
    }

    updateTrackInfo(card) {
        const currentTimeElem = card.querySelector('.current-time');
        const durationElem = card.querySelector('.duration-inner');
        const currentDurationElem = card.querySelector('.current-duration');

        const update = () => {
            const seek = this.currentHowl.seek();
            const duration = this.currentHowl.duration();

            currentTimeElem.textContent = this.formatTime(seek);
            currentDurationElem.textContent = this.formatTime(duration);

            gsap.to(durationElem, { width: `${(seek / duration) * 100}%`, duration: 0.1, ease: 'linear' });
        };

        clearInterval(this.updateInterval);
        this.updateInterval = setInterval(update, 1000);
        update();
    }

    formatTime(secs) {
        const minutes = Math.floor(secs / 60) || 0;
        const seconds = Math.floor(secs % 60) || 0;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    playPreviousTrack() {
        const trackItems = this.currentCard.querySelectorAll('.track-item');
        this.currentTrackIndex = (this.currentTrackIndex === 0) ? trackItems.length - 1 : this.currentTrackIndex - 1;
        this.playTrack(trackItems[this.currentTrackIndex].dataset.url, this.currentTrackIndex, this.currentCard);
    }

    togglePlayPause(card) {
        // Check if we're switching to a new album
        if (this.currentAlbum !== card) {
            this.stopMusic();
            this.currentAlbum = card;
            this.currentTrackIndex = 0;
        }

        if (this.currentHowl && this.currentCard === card) {
            if (this.currentHowl.playing()) {
                this.currentHowl.pause();
                clearInterval(this.updateInterval);
                this.animatePlayIcon(card, false);
                gsap.to('.player-info', { opacity: 0, duration: 0.5 });
            } else {
                this.currentHowl.play();
                this.updateTrackInfo(card);
                this.animatePlayIcon(card, true);
                gsap.to('.player-info', { opacity: 1, duration: 0.5 });
            }
        } else {
            const firstTrack = card.querySelector('.track-item');
            if (firstTrack) {
                this.animateCardsToSamePosition();
                this.playTrack(firstTrack.dataset.url, 0, card);
            }
        }
    }

    stopMusic() {
        if (this.currentHowl) {
            this.currentHowl.stop();
            clearInterval(this.updateInterval);
        }
        gsap.to('.player-info', { opacity: 0, duration: 0.5 });
        if (this.currentCard) {
            this.animatePlayIcon(this.currentCard, false);
        }
    }

    playNextTrack() {
        const trackItems = this.currentCard.querySelectorAll('.track-item');
        this.currentTrackIndex = (this.currentTrackIndex === trackItems.length - 1) ? 0 : this.currentTrackIndex + 1;
        this.playTrack(trackItems[this.currentTrackIndex].dataset.url, this.currentTrackIndex, this.currentCard);
    }

    animatePlayIcon(card, isPlaying) {
        const playIconPath = card.querySelector('.play-icon path');
        gsap.to(playIconPath, {
            morphSVG: isPlaying ? shape2 : shape1,
            duration: 0.5,
            ease: 'cubic'
        });
    }
}
