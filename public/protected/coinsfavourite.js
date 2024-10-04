document.addEventListener('DOMContentLoaded', async () => {
    const favoritesContainer = document.getElementById('favorites-container');

    const transitionCover = document.querySelector('.transition-cover');
    const transitionUncover = document.querySelector('.transition-uncover');

    function startTransition(targetUrl) {
        if (transitionCover) {
            transitionCover.classList.add('is-active');

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 700); 
        }
    }

    function initializeTransitions() {
        if (transitionCover) transitionCover.classList.remove('is-active');
        if (transitionUncover) transitionUncover.classList.remove('is-active');
    }

    // Initialize transitions on load
    setTimeout(initializeTransitions, 700);

    // Listen for visibility change to re-initialize transitions
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            initializeTransitions();
        }
    });

    document.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = e.target.href;
            startTransition(target);
        });
    });

    if (!favoritesContainer) {
        console.error('Favorites container not found in the DOM.');
        return;
    }

    fetchFavorites();

    async function fetchFavorites() {
        try {
            const response = await fetch('/api/favourites', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const favorites = await response.json();
                displayFavorites(favorites);
            } else {
                console.error('Expected JSON response but got something else.');
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    }

    function displayFavorites(favorites) {
        favoritesContainer.innerHTML = '';

        favorites.forEach(coin => {
            const cryptoElement = document.createElement('div');
            cryptoElement.className = 'crypto';
            cryptoElement.dataset.favorite = 'true';
            cryptoElement.style.cursor = 'pointer';

            cryptoElement.innerHTML = `
                <img src="${coin.image}" alt="${coin.name}">
                <h2>${coin.name}</h2>
            `;

            cryptoElement.addEventListener('click', () => {
                startTransition(`https://revised-frontend.onrender.com/${coin.id}`);
            });

            favoritesContainer.appendChild(cryptoElement);
        });
    }
});
