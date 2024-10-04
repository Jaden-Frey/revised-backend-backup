document.addEventListener('DOMContentLoaded', async () => {
    const cryptoContainer = document.getElementById('crypto-container');
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    document.body.appendChild(messageContainer);

    let favoriteIds = new Set();
    const cryptoNameMap = new Map();

    const transitionCover = document.querySelector('.transition-cover');
    const transitionUncover = document.querySelector('.transition-uncover');

    function showMessage(message, type) {
        messageContainer.textContent = message;
        messageContainer.className = `message-container ${type}`;
        messageContainer.style.display = 'block';
        messageContainer.style.opacity = '1';

        setTimeout(() => {
            messageContainer.style.opacity = '0';
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 700);
        }, 700);
    }

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

    setTimeout(initializeTransitions, 700);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            initializeTransitions();
        }
    });

    document.querySelectorAll('a').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.href;
            startTransition(target);
        });
    });

    try {
        const response = await fetch('/api/cryptocurrencies');
        const data = await response.json();

        const uniqueCryptos = {};
        data.forEach((crypto) => {
            if (
                !uniqueCryptos[crypto.id] ||
                new Date(crypto.last_updated) > new Date(uniqueCryptos[crypto.id].last_updated)
            ) {
                uniqueCryptos[crypto.id] = crypto;
            }
        });

        const uniqueData = Object.values(uniqueCryptos);

        const favoritesResponse = await fetch('/api/favourites', {
            method: 'GET',
            credentials: 'include',
        });
        const favorites = await favoritesResponse.json();
        favoriteIds = new Set(favorites.map((fav) => fav.id));

        uniqueData.forEach((crypto) => {
            cryptoNameMap.set(crypto.id, crypto.name);

            const cryptoElement = document.createElement('div');
            cryptoElement.className = 'crypto';
            cryptoElement.style.cursor = 'pointer';
            cryptoElement.dataset.id = crypto.id;

            if (favoriteIds.has(crypto.id)) {
                cryptoElement.classList.add('favorite');
            }

            cryptoElement.innerHTML = `
                <img src="${crypto.image}" alt="${crypto.name}">
                <h2>${crypto.name}</h2>
                <span class="heart-icon ${favoriteIds.has(crypto.id) ? 'favorite' : ''}">&#10084;</span>
            `;

            const heartIcon = cryptoElement.querySelector('.heart-icon');
            heartIcon.addEventListener('click', async (e) => {
                e.stopPropagation();

                if (favoriteIds.has(crypto.id)) {
                    await removeFromFavorites(crypto.id);
                    showMessage(`${crypto.name} has been removed from favorites.`, 'success');
                } else {
                    await addToFavorites(crypto.id);
                    showMessage(`${crypto.name} has been added to favorites.`, 'success');
                }
            });

            cryptoElement.addEventListener('click', () => {
                startTransition(`http://localhost:5001/${crypto.id}`);
            });

            cryptoContainer.appendChild(cryptoElement);
        });
    } catch (error) {
        console.error('Error fetching cryptocurrency data:', error);
    }

    async function addToFavorites(coinId) {
        try {
            const response = await fetch('/favourites/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coinId }),
                credentials: 'include',
            });

            if (response.ok) {
                favoriteIds.add(coinId);
                const coinElement = document.querySelector(`.crypto[data-id="${coinId}"]`);
                if (coinElement) {
                    coinElement.classList.add('favorite');
                    const heartIcon = coinElement.querySelector('.heart-icon');
                    heartIcon.classList.add('favorite');
                }
            }
        } catch (error) {
            console.error('Error adding favorite:', error);
        }
    }

    async function removeFromFavorites(coinId) {
        try {
            const response = await fetch('/favourites/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coinId }),
                credentials: 'include',
            });

            if (response.ok) {
                favoriteIds.delete(coinId);
                const coinElement = document.querySelector(`.crypto[data-id="${coinId}"]`);
                if (coinElement) {
                    coinElement.classList.remove('favorite');
                    const heartIcon = coinElement.querySelector('.heart-icon');
                    heartIcon.classList.remove('favorite');
                }
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    }
});
