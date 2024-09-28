import { gsap } from "gsap";
import lottie from 'lottie-web';

export class Videos {
    constructor(container) {
        this.container = container;
        this.apiKey = 'AIzaSyALqidJRST-mo-pMbtXZit-GOtfB6j0pb0'; // Replace with your actual API key securely
        this.videoItems = Array.from(this.container.querySelectorAll('.videos-item'));
        this.playlistIds = this.videoItems.map(item => this.getYouTubePlaylistId(item.getAttribute('data-playlist-id')));
        this.videoListWrapper = this.container.querySelector('.videos-list-wrapper');
        this.videoContentContainer = this.container.querySelector('.videos-c');
        this.videoContentGrid = this.container.querySelector('.videos-content-grid');
        this.backButton = this.container.querySelector('.video-content-back-btn');
        this.currentVideo = null;
        this.videoData = new Map();

        this.init().then(() => {
            setTimeout(() => {
                this.revealContent();
                this.addEventListeners();
            }, 50);
        });
    }

    getYouTubePlaylistId(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get('list') || null;
        } catch (error) {
            console.error('Invalid URL:', url);
            return null;
        }
    }

    async init() {
        try {
            for (const [index, playlistId] of this.playlistIds.entries()) {
                if (!playlistId) continue;
                const playlistVideos = await this.fetchPlaylistVideos(playlistId);
                this.renderVideos(playlistVideos, this.videoItems[index]);
            }
        } catch (error) {
            console.error("Error fetching playlist videos:", error);
        }
    }

    async fetchPlaylistVideos(playlistId) {
        const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
        const maxResults = 50;
        let pageToken = '';
        let playlistVideos = [];

        do {
            const url = `${baseUrl}?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&pageToken=${pageToken}&key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                playlistVideos = playlistVideos.concat(data.items);
            }

            pageToken = data.nextPageToken || '';
        } while (pageToken);

        return playlistVideos;
    }

    renderVideos(videos, container) {
        const wrapper = container.querySelector('.videos-playlist-wrapper');
        wrapper.innerHTML = '';

        videos.forEach(video => {
            const { snippet } = video;
            const videoTitle = snippet.title;
            const thumbnailUrl = snippet.thumbnails?.maxres?.url || snippet.thumbnails?.standard?.url || snippet.thumbnails?.default?.url;
            const videoId = snippet.resourceId.videoId;

            // Store video data
            this.videoData.set(videoId, snippet);

            const videoItem = document.createElement('div');
            videoItem.classList.add('videos-playlist-item');
            videoItem.dataset.videoId = videoId;
            videoItem.innerHTML = `
                <div class="video-playlist-img">
                    <img src="${thumbnailUrl}" loading="lazy" alt="${videoTitle}">
                    <div class="lottie-block">
                        <div class="lottie-content"></div>
                    </div>
                </div>
                <h2 class="video-playlist-title">${videoTitle}</h2>
            `;
            wrapper.appendChild(videoItem);
        });

        this.initLottieAnimations(wrapper);
    }

    initLottieAnimations(wrapper) {
        const lottieBlocks = wrapper.querySelectorAll('.lottie-content');
        lottieBlocks.forEach(block => {
            const animation = lottie.loadAnimation({
                container: block,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                path: 'https://uploads-ssl.webflow.com/6634c23145c0a86a4c0bda23/66c320b8a2a9fc2b4e18b47a_yj3hYNld6N.json'
            });

            const parentImage = block.closest('.video-playlist-img');
            parentImage.addEventListener('mouseenter', () => {
                animation.setDirection(1);
                animation.play();
            });

            parentImage.addEventListener('mouseleave', () => {
                animation.setDirection(-1);
                animation.stop();
            });
        });
    }

    revealContent() {
        gsap.to(this.videoListWrapper, {
            autoAlpha: 1,
            duration: 0.5,
            ease: "power2.out",
        });

        this.videoItems.forEach(item => {
            gsap.timeline()
                .from(item.querySelector('h1'), { yPercent: 100, duration: 0.6, ease: "power2.out" })
                .from(item.querySelectorAll('.videos-playlist-item'), {
                    yPercent: 110,
                    opacity: 0,
                    stagger: { amount: 0.2, ease: "expo.out" }
                }, "<");
        });
    }

    addEventListeners() {
        this.container.addEventListener('click', (e) => {
            const playlistItem = e.target.closest('.videos-playlist-item');
            if (playlistItem) {
                const videoId = playlistItem.dataset.videoId;
                this.playVideo(videoId);
            }
        });

        this.backButton.addEventListener('click', () => {
            this.closeVideo();
        });
    }

    playVideo(videoId) {
        const videoData = this.videoData.get(videoId);
        if (!videoData) {
            console.error('Video data not found');
            return;
        }

        const videoTitle = videoData.title;
        const channelTitle = videoData.videoOwnerChannelTitle || videoData.channelTitle;
        const description = videoData.description;

        // Update content
        this.videoContentGrid.querySelector('h1').textContent = videoTitle;
        this.videoContentGrid.querySelector('.video-content-channel-title').textContent = channelTitle || '';

        // Update description with preserved formatting and clickable links
        const descriptionElement = this.videoContentGrid.querySelector('.video-content-description');
        descriptionElement.innerHTML = this.formatDescription(description);

        // Create and embed YouTube player
        const videoContentMedia = this.videoContentGrid.querySelector('.video-content-media');
        videoContentMedia.innerHTML = `
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        `;

        // Animate section
        gsap.to(this.videoContentContainer, {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1,
            ease: 'expo.out'
        });

        this.currentVideo = videoContentMedia.querySelector('iframe');
    }

    closeVideo() {
        if (this.currentVideo) {
            // Stop video playback
            this.currentVideo.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
        }

        // Animate section back to previous state
        gsap.to(this.videoContentContainer, {
            clipPath: 'inset(100% 0% 0% 0%)',
            duration: 0.5,
            ease: 'expo.out',
            onComplete: () => {
                // Clear video content
                this.videoContentGrid.querySelector('.video-content-media').innerHTML = '';
                this.currentVideo = null;
            }
        });
    }

    formatDescription(description) {
        if (!description) return '';
        const lines = description.split('\n');

        const formattedLines = lines.map(line => {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return line.replace(urlRegex, url =>
                `<a href="${url}" target="_blank" style="text-decoration: underline;">${url}</a>`
            );
        });

        return formattedLines.join('<br>');
    }
}
