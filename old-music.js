import { gsap } from "gsap";
import CustomEase from "gsap/CustomEase";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import ColorThief from "colorthief";
import { Howl, Howler } from 'howler';
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";


gsap.registerPlugin(CustomEase, MorphSVGPlugin,ScrambleTextPlugin);
CustomEase.create("cubic", ".83,0,.17,1");

const shape1 = 'M16.38 0C7.33868 0 0 7.33868 0 16.38C0 25.4214 7.33868 32.76 16.38 32.76C25.4214 32.76 32.76 25.4214 32.76 16.38C32.76 7.33868 25.4214 0 16.38 0ZM16.38 0.84C24.9669 0.84 31.92 7.79308 31.92 16.38C31.92 24.9669 24.9669 31.92 16.38 31.92C7.79308 31.92 0.84 24.9669 0.84 16.38C0.84 7.79308 7.79308 0.84 16.38 0.84ZM11.76 8.81998V23.94L24.36 16.38L18.06 12.6L11.76 8.81998Z';
const shape2 = 'M16.38 0.740021C7.33868 0.740021 0 8.0787 0 17.12C0 26.1614 7.33868 33.5 16.38 33.5C25.4214 33.5 32.76 26.1614 32.76 17.12C32.76 8.0787 25.4214 0.740021 16.38 0.740021ZM16.38 1.58002C24.9669 1.58002 31.92 8.5331 31.92 17.12C31.92 25.7069 24.9669 32.66 16.38 32.66C7.79308 32.66 0.84 25.7069 0.84 17.12C0.84 8.5331 7.79308 1.58002 16.38 1.58002ZM11.76 12.74V22.74H21V12.74H11.76Z'


export class Music {
    albumTracks = []
    tlAnimation
    visibleCardsCount = 8; // Set the maximum number of visible cards
    constructor(container) {
        this.container = container;
        this.colorThief = new ColorThief();
        this.cards = [...this.container.querySelectorAll(".music-cc-item")];
        this.workImages = [...this.container.querySelectorAll('.h-img')];
        this.isAnimating = false;
        this.slider = container.querySelector(".music-cc-list");
        this.init();
        this.currentTrackIndex = 0;
        this.currentCard = null;
        this.currentHowl = null;
        this.updateInterval = null;
        this.trackName = container.querySelector('#track-name')
    }

    init() {
        this.getColors();
        this.initCards();
        this.loadTracks();
        this.addEventListeners();
    }

    getTextColor(r, g, b) {
        // Calculate the brightness of the color
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        // Return white for dark colors and black for light colors
        return brightness > 128 ? 'black' : 'white';
    }

    getColors() {
        this.workImages.forEach((img) => {
            img.crossOrigin = "Anonymous";
            new Promise((resolve) => {
                if (img.complete) {
                    resolve(this.colorThief.getColor(img));
                } else {
                    img.addEventListener('load', () => {
                        resolve(this.colorThief.getColor(img));
                    });
                }
            }).then(color => {
                const textColor = this.getTextColor(color[0], color[1], color[2]);
                const parentElement = img.closest(".music-cc-item");
                gsap.set(parentElement, { backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` });
                gsap.set(parentElement, { color: textColor });
            });
        });
    }

    initCards() {
        let cards = [...this.slider.querySelectorAll(".music-cc-item")];
        gsap.to(cards, {
            y: (i) => -5 + 5 * i + "%",
            z: (i) => 10 * i,
            duration: 1,
            ease: "cubic",
            stagger: -0.1,
            onComplete: () => {
                gsap.to(cards, {
                    opacity: 1,
                    duration: 0.1
                });
            }
        });
    }

    animateCards(direction) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        let cards = [...this.slider.querySelectorAll(".music-cc-item")];

        gsap.to('.player-info', {opacity: 0, duration: 0.5});

        if (direction === "next") {
            let lastCard = cards.pop();
            gsap.to(lastCard, {
                y: "+=150%",
                duration: 0.75,
                ease: "cubic",
                onComplete: () => {
                    this.slider.prepend(lastCard);
                    this.initCards();
                    setTimeout(() => {
                        this.isAnimating = false;
                    }, 200);
                }
            });
            gsap.set(lastCard, {
                opacity: 0,
                duration: 0.3,
                delay: 0.7
            });
        } else if (direction === "prev") {
            let firstCard = cards.shift();
            this.slider.append(firstCard);
            this.initCards();

            gsap.fromTo(firstCard, {
                y: "+=300%",
                opacity: 1
            }, {
                y: 0,
                opacity: 1,
                duration: 0.75,
                ease: "cubic",
                onComplete: () => {
                    setTimeout(() => {
                        this.isAnimating = false;
                    }, 200);
                }
            });
        }
    }

    addEventListeners() {
        const nextButton = this.container.querySelector(".next-button");
        const prevButton = this.container.querySelector(".prev-button");

        nextButton.addEventListener("click", () => {
            this.animateCards('next')
        });

        prevButton.addEventListener("click", () => {
            this.animateCards('prev')
        });

        this.cards.forEach((card) => {
            card.querySelector('.n-button').addEventListener('click', () => {
                this.animateCardsToSamePosition();
            });

            card.addEventListener('click', (event) => {
                if (event.target.closest('.track-item')) {
                    const trackItem = event.target.closest('.track-item');
                    const trackItems = Array.from(card.querySelectorAll('.track-item'));
                    const index = trackItems.indexOf(trackItem);
                    this.playTrack(trackItem.dataset.url, index, card);
                    this.animateCardsToSamePosition()
                } else if (event.target.closest('.previous-icon')) {
                    this.playPreviousTrack();
                } else if (event.target.closest('.play-icon')) {
                    this.togglePlayPause(card);
                } else if (event.target.closest('.next-icon')) {
                    this.playNextTrack();
                }
            });
        });
    }

    animateCardsToSamePosition() {
        let cards = [...this.slider.querySelectorAll(".music-cc-item")];
        this.tlAnimation = gsap.timeline();
        this.tlAnimation.to(cards, {
            y: 0,
            z: 0,
            duration: 1,
            ease: "cubic"
        });
        this.tlAnimation.to('.music-view', {opacity: 0, display: 'none', duration: 0.3}, "<");
        this.tlAnimation.to('.music-tracks', {height: '100%', duration: 0.5}, ">");
        this.tlAnimation.to('.music-duration', {height: '100%', duration: 0.3}, "<");
    }

    async loadTracks() {
        try {
            const responses = await Promise.all(this.cards.map((card) =>
                fetch(card.dataset.url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            ));

            for (const response of responses) {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.albumTracks.push(data.data);
            }

            console.log(this.albumTracks);
            this.addTracks();
        } catch (error) {
            console.error('Error fetching track:', error);
        }
    }

    addTracks() {
        this.albumTracks.forEach((album, albumIndex) => {
            album.forEach((track, trackIndex) => {
                const trackNumber = String(trackIndex + 1).padStart(2, '0');
                const name = track['optimized_audio']['name'];
                const trackURL = track['optimized_audio']['cloudfront_url'];

                // Create a new track item div
                const trackItem = document.createElement('div');
                trackItem.classList.add('track-item');
                trackItem.dataset.url = trackURL;

                // Create <p> elements for track number and name
                const trackNumberElement = document.createElement('p');
                trackNumberElement.textContent = `${trackNumber}`;
                trackItem.appendChild(trackNumberElement);

                const nameElement = document.createElement('p');
                nameElement.textContent = name;
                trackItem.appendChild(nameElement);

                // Append track item to corresponding card (music-cc-item)
                const targetCard = this.cards[ albumIndex]; // Assuming 1:1 correspondence
                targetCard.querySelector('.music-tracks').appendChild(trackItem);
            });
        });
    }

    playTrack(url, index, card) {
        if (this.currentHowl) {
            this.currentHowl.stop();
            clearInterval(this.updateInterval);
        }

        this.currentTrackIndex = index;
        this.currentCard = card;
        let name = card.querySelector(`.track-item:nth-of-type(${index + 1}) p:nth-of-type(2)`).textContent;

        gsap.to('.player-info', {opacity: 1, duration: 0.5});
        gsap.to(this.trackName, {
            duration: 1,
            scrambleText: {
                text: name,
                chars: "O",
                speed: 1,
            }
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

            const progress = (seek / duration) * 100;
            gsap.to(durationElem, { width: `${progress}%`, duration: 0.1, ease: 'linear' });

            if (seek >= duration) {
                clearInterval(this.updateInterval);
            }
        };

        clearInterval(this.updateInterval);  // Clear previous interval
        this.updateInterval = setInterval(update, 1000);
        update();
    }

    formatTime(secs) {
        const minutes = Math.floor(secs / 60) || 0;
        const seconds = Math.floor(secs % 60) || 0;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    playPreviousTrack() {
        if (this.currentTrackIndex === 0) {
            this.currentTrackIndex = this.currentCard.querySelectorAll('.track-item').length - 1;
        } else {
            this.currentTrackIndex--;
        }
        const previousTrack = this.currentCard.querySelectorAll('.track-item')[this.currentTrackIndex];
        this.playTrack(previousTrack.dataset.url, this.currentTrackIndex, this.currentCard);
    }

    togglePlayPause(card) {
        if (this.currentHowl) {
            if (this.currentHowl.playing()) {
                this.currentHowl.pause();
                clearInterval(this.updateInterval);
                this.animatePlayIcon(card, false);
                gsap.to('.player-info', {opacity: 0, duration: 0.5});
            } else {
                this.currentHowl.play();
                this.updateTrackInfo(card);
                this.animatePlayIcon(card, true);
            }
        } else {
            // Start playing the first track if no track is currently playing
            const firstTrack = card.querySelector('.track-item');
            if (firstTrack) {
                this.animateCardsToSamePosition()
                const trackURL = firstTrack.dataset.url;
                this.playTrack(trackURL, 0, card);
            }
        }
    }

    playNextTrack() {
        if (this.currentTrackIndex === this.currentCard.querySelectorAll('.track-item').length - 1) {
            this.currentTrackIndex = 0;
        } else {
            this.currentTrackIndex++;
        }
        const nextTrack = this.currentCard.querySelectorAll('.track-item')[this.currentTrackIndex];
        this.playTrack(nextTrack.dataset.url, this.currentTrackIndex, this.currentCard);
    }

    animatePlayIcon(card, isPlaying) {
        const playIconPath = card.querySelector('.play-icon path');
        if (isPlaying) {
            gsap.to(playIconPath, { morphSVG: shape2, duration: 0.5, ease: 'cubic' });
        } else {
            gsap.to(playIconPath, { morphSVG: shape1, duration: 0.5, ease: 'cubic' });
        }
    }
}
