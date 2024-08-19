import { gsap } from "gsap";
import lottie from 'lottie-web';

export class Videos {
    constructor(container) {
        this.container = container;
        this.apiKey = 'AIzaSyALqidJRST-mo-pMbtXZit-GOtfB6j0pb0';
        this.videoItems = [...this.container.querySelectorAll('.videos-item')];
        this.playlistIds = this.videoItems.map((item) => item.getAttribute('data-playlist-id'));
        this.videoListWrapper = this.container.querySelector('.videos-list-wrapper');
        this.videoContentContainer = this.container.querySelector('.videos-c');
        this.videoContentGrid = this.container.querySelector('.videos-content-grid');
        this.backButton = this.container.querySelector('.video-content-back-btn');
        this.currentVideo = null;
        this.videoData = new Map(); // Store video data

        this.init().then(() =>
            window.setTimeout(() => {
                this.revealContent()
                this.addEventListeners();
            }, 100)
        );

    }

    async init() {
        try {
            for (const [index, playlistId] of this.playlistIds.entries()) {
                const playlistVideos = await this.fetchPlaylistVideos(playlistId);
                console.log(playlistVideos);
                this.renderVideos(playlistVideos, this.videoItems[index]);
            }
        } catch (error) {
            console.error("Error fetching playlist videos:", error);
        }
    }

    async fetchPlaylistVideos(playlistId) {
        const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
        const maxResults = 50; // Maximum number of results per request
        let pageToken = '';
        let playlistVideos = [];

        do {
            const url = `${baseUrl}?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&pageToken=${pageToken}&key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                playlistVideos = playlistVideos.concat(data.items);
            }

            pageToken = data.nextPageToken;
        } while (pageToken);

        return playlistVideos;
    }

    renderVideos(videos, container) {
        const wrapper = container.querySelector('.videos-playlist-wrapper');
        wrapper.innerHTML = ''; // Clear existing content

        videos.forEach(video => {
            const videoSnippet = video.snippet;
            const videoTitle = videoSnippet.title;
            const thumbnailUrl = videoSnippet.thumbnails?.maxres?.url || videoSnippet.thumbnails?.standard?.url;
            const videoId = videoSnippet.resourceId.videoId;

            // Store video data
            this.videoData.set(videoId, videoSnippet);

            const videoItemHtml = `
                <div class="videos-playlist-item" data-video-id="${videoId}">
                    <div class="video-playlist-img">
                        <img src="${thumbnailUrl}" loading="lazy" alt="${videoTitle}">
                        <div class="lottie-block">
                            <div class="lottie-content"></div>
                        </div>
                    </div>
                    <h2 class="video-playlist-title">${videoTitle}</h2>
                </div>
            `;
            wrapper.insertAdjacentHTML('beforeend', videoItemHtml);
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

            // Add event listeners or additional logic for playing the animation
            block.closest('.video-playlist-img').addEventListener('mouseenter', () => {
                animation.setDirection(1)
                animation.play();
            });

            block.closest('.video-playlist-img').addEventListener('mouseleave', () => {
                animation.setDirection(-1)
                animation.stop();
            });
        });
    }

    revealContent() {
        gsap.to(this.videoListWrapper, {
            autoAlpha: 1,
            duration: 2,
            ease: "power2.out",
        });

        this.videoItems.forEach((item, index) => {
            let tl = gsap.timeline();
            tl.from(item.querySelector('h1'), {yPercent: 100, duration: 0.6, ease: "power2.out"})
                .from(item.querySelectorAll('.videos-playlist-item'), {yPercent: 110, opacity: 1, stagger: {amount: 0.3, ease: "expo.out"}})
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
        const channelTitle = videoData.videoOwnerChannelTitle;
        const description = videoData.description;

        // Update content
        this.videoContentGrid.querySelector('h1').textContent = videoTitle;
        this.videoContentGrid.querySelector('.video-content-channel-title').textContent = channelTitle;

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
        // Split the description into lines
        const lines = description.split('\n');

        // Process each line separately
        const formattedLines = lines.map(line => {
            // Make URLs clickable and underlined
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return line.replace(urlRegex, url =>
                `<a href="${url}" target="_blank" style="text-decoration: underline;">${url}</a>`
            );
        });

        // Join the lines back together with <br> tags
        return formattedLines.join('<br>');
    }
}