document.addEventListener('DOMContentLoaded', async () => {
    const cryptoContainer = document.getElementById('crypto-container');

    try {
        const response = await fetch('/api/cryptocurrencies');
        const data = await response.json();

        const uniqueCryptos = {};

        // Merge duplicate entries keeping the latest one based on last_updated
        data.forEach(crypto => {
            if (!uniqueCryptos[crypto.id] || new Date(crypto.last_updated) > new Date(uniqueCryptos[crypto.id].last_updated)) {
                uniqueCryptos[crypto.id] = crypto;
            }
        });

        // Convert the object back to an array
        const uniqueData = Object.values(uniqueCryptos);

        uniqueData.forEach(crypto => {
            const cryptoElement = document.createElement('div');
            cryptoElement.className = 'crypto';
            
            const priceChangeClass = crypto.price_change_24h >= 0 ? 'price-change-positive' : 'price-change-negative';
            const priceChangeArrow = crypto.price_change_24h >= 0 ? '▲' : '▼';

            // Round the percentage change to two decimal places
            const roundedPercentageChange = crypto.price_change_percentage_24h.toFixed(2);

            // Determine the border color based on price change
            const borderColor = crypto.price_change_24h >= 0 ? '#28A745' : '#DC143C'; 
            const borderStyle = `3px solid ${borderColor}`;

            cryptoElement.style.border = borderStyle;

            cryptoElement.innerHTML = `
            <img src="${crypto.image}" alt="${crypto.name}">
            <h2>${crypto.name} (${crypto.symbol.toUpperCase()})</h2>
            <p><span class="label">Current Price:</span> <span class="value">$${crypto.current_price.toLocaleString()}</span></p>
            <p><span class="label">Market Cap:</span> <span class="value">$${crypto.market_cap.toLocaleString()}</span></p>
            <p><span class="label">24h High:</span> <span class="value">$${crypto.high_24h.toLocaleString()}</span></p>
            <p><span class="label">24h Low:</span> <span class="value">$${crypto.low_24h.toLocaleString()}</span></p>
            <p><span class="label">Price Change 24h:</span> <span class="price-change ${priceChangeClass}">$${crypto.price_change_24h.toLocaleString()}</span></p>
            <p><span class="label">Price Change Percentage 24h:</span> <span class="price-change ${priceChangeClass}">${roundedPercentageChange}% ${priceChangeArrow}</span></p>
            `;
            cryptoContainer.appendChild(cryptoElement);
        });
    } catch (error) {
        console.error('Error fetching cryptocurrency data:', error);
    }
});
