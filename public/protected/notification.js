document.addEventListener('DOMContentLoaded', async () => {
    const notificationButton = document.getElementById('notification-button');
    const notificationList = document.getElementById('notification-list');
    let notifications = {};

    // Retrieve viewed notifications from localStorage (persists across sessions)
    let viewedNotifications = JSON.parse(localStorage.getItem('viewedNotifications')) || {};
    
    // Retrieve active notifications from localStorage
    let activeNotifications = JSON.parse(localStorage.getItem('activeNotifications')) || {};

    // Update the notification button HTML to use a more professional icon
    notificationButton.innerHTML = `
      <i class="fas fa-bell" style="font-size: 1.5rem; color: silver; position: relative; top: 10px; left: -15px;"></i>
      <span id="notification-dot" class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style="display: none; transform: translate(-50%, 50%);"></span>
    `;

    const notificationDot = document.getElementById('notification-dot');

    // Add reload button to the notification list
    const reloadButton = document.createElement('span');
    reloadButton.id = 'reload-button';
    reloadButton.innerHTML = '🔄';
    reloadButton.style.position = 'sticky';
    reloadButton.style.top = '0';
    reloadButton.style.float = 'left'; 
    reloadButton.style.fontSize = '1.75rem';
    reloadButton.style.cursor = 'pointer';
    reloadButton.style.marginBottom = '10px';
    reloadButton.title = 'Reload notifications';
    notificationList.insertBefore(reloadButton, notificationList.firstChild);

    // Function to update the notification dot
    function updateNotificationDot() {
        const hasUnviewedNotifications = Object.keys(activeNotifications).some(cryptoName => !viewedNotifications[cryptoName]);
        notificationDot.style.display = hasUnviewedNotifications ? 'block' : 'none';
    }

    // Function to check for market cap alert
    function checkMarketCapAlert(crypto, messages) {
        const threshold = 10;
        if (Math.abs(crypto.market_cap_change_percentage_24h) >= threshold) {
            const marketCapChange = crypto.market_cap_change_24h;
            const percentageChange = crypto.market_cap_change_percentage_24h.toFixed(2);
            const changeType = marketCapChange > 0 ? 'increased' : 'decreased';
            messages.push(`Market Cap Alert: ${crypto.name}'s market cap has ${changeType} by ${percentageChange}% ($${Math.abs(marketCapChange).toLocaleString()}) in the last 24h.`);
        }
    }

    // Function to check for price alert
    function checkPriceAlert(crypto, messages) {
        const threshold = 2;
        const priceChangeAmount = crypto.current_price * (threshold / 100);

        if (Math.abs(crypto.price_change_24h) >= priceChangeAmount) {
            const changeType = crypto.price_change_24h > 0 ? 'increased' : 'decreased';
            messages.push(`Price Alert: ${crypto.name}'s price has ${changeType} by ${crypto.price_change_percentage_24h.toFixed(2)}% ($${Math.abs(crypto.price_change_24h).toLocaleString()}) in the last 24h.`);
        }
    }

    // Function to check ATH/ATL recovery alerts
    function checkAthAtlRecoveryAlert(crypto, messages) {
        const athDropThreshold = 20; // 20% drop from ATH
        const atlRecoveryThreshold = 50; // 50% recovery from ATL

        const athDropPercentage = ((crypto.ath - crypto.current_price) / crypto.ath) * 100;
        const atlRecoveryPercentage = ((crypto.current_price - crypto.atl) / crypto.atl) * 100;

        if (athDropPercentage >= athDropThreshold && athDropPercentage <= 90) {
            messages.push(`ATH Alert: ${crypto.name} has dropped ${athDropPercentage.toFixed(2)}% from its all-time high of $${crypto.ath}.`);
        }

        if (atlRecoveryPercentage >= atlRecoveryThreshold && atlRecoveryPercentage <= 500) {
            messages.push(`ATL Alert: ${crypto.name} has recovered ${atlRecoveryPercentage.toFixed(2)}% from its all-time low of $${crypto.atl}.`);
        }
    }

    // Function to check supply analysis
    function checkSupplyAnalysis(crypto, messages) {
        if (crypto.circulating_supply && crypto.total_supply) {
            const supplyPercentage = (crypto.circulating_supply / crypto.total_supply) * 100;
            messages.push(`Supply Alert: ${crypto.name} has ${supplyPercentage.toFixed(2)}% of its total supply in circulation.`);
        }
    }

    // Function to check volume analysis
    function checkVolumeAnalysis(crypto, messages) {
        const volumeChangeThreshold = 10;
        const volumeChangePercentage = ((crypto.total_volume / crypto.market_cap) * 100).toFixed(2);

        if (volumeChangePercentage > volumeChangeThreshold) {
            messages.push(`Volume Alert: ${crypto.name} is experiencing high trading activity, with current trading making up ${volumeChangePercentage}% of its market cap.`);
        }
    }

    // Function to check market cap rank
    function checkMarketCapRank(crypto, messages) {
        if (crypto.market_cap_rank) {
            messages.push(`Rank Alert: ${crypto.name} is currently ranked #${crypto.market_cap_rank} by market cap on the Exchange.`);
        }
    }

    // Function to add notifications to the list
    function addNotification(cryptoName, messages, alertType, isReload = false) {
        if (!isReload && viewedNotifications[cryptoName]) {
            return;
        }

        activeNotifications[cryptoName] = messages;
        localStorage.setItem('activeNotifications', JSON.stringify(activeNotifications));
        updateNotificationDot();

        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.style.direction = 'ltr'; 

        const iconMap = {
            'market_cap': '▣', 
        };

        // Default to the square if the alertType doesn't match
        const alertIcon = iconMap[alertType] || '▣';

        // Timestamp for each notification
        const timeStamp = new Date().toLocaleString();

        // Building the notification item HTML
        notificationItem.innerHTML = 
            `<div class="notification-header">
                <strong>${cryptoName}</strong>
                <span class="notification-time">${timeStamp}</span>
            </div>
            <ul class="notification-content">
                ${messages.map(msg => `<li><span class="alert-icon">${alertIcon}</span> ${msg}</li>`).join('')}
            </ul>`;

        // Append the notification to the list
        notificationList.appendChild(notificationItem);

        let isHovered = false;

        notificationItem.addEventListener('mouseenter', () => {
            isHovered = true;
            viewedNotifications[cryptoName] = true;
            localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));
            updateNotificationDot();
        });

        notificationItem.addEventListener('mouseleave', () => {
            if (isHovered) {
                notificationItem.style.opacity = '0';
                notificationItem.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    notificationList.removeChild(notificationItem);
                    delete activeNotifications[cryptoName];
                    localStorage.setItem('activeNotifications', JSON.stringify(activeNotifications));
                    if (notificationList.children.length === 1) { 
                        notificationList.style.display = 'none';
                    }
                    updateNotificationDot();
                }, 500);
            }
        });
    }

    async function fetchAndProcessData() {
        try {
            const response = await fetch('/api/cryptocurrencies');
            const data = await response.json();

            const uniqueCryptos = {};

            data.forEach(crypto => {
                if (!uniqueCryptos[crypto.id] || new Date(crypto.last_updated) > new Date(uniqueCryptos[crypto.id].last_updated)) {
                    uniqueCryptos[crypto.id] = crypto;
                }
            });

            const uniqueData = Object.values(uniqueCryptos);

            uniqueData.forEach(crypto => {
                const messages = [];
                checkMarketCapAlert(crypto, messages);
                checkPriceAlert(crypto, messages);
                checkAthAtlRecoveryAlert(crypto, messages);
                checkSupplyAnalysis(crypto, messages);
                checkVolumeAnalysis(crypto, messages);
                checkMarketCapRank(crypto, messages);

                if (messages.length > 0 && !activeNotifications[crypto.name]) {
                    addNotification(crypto.name, messages, 'market_cap', true);
                }
            });

            updateNotificationDot();
        } catch (error) {
            console.error('Error fetching cryptocurrency data:', error);
        }
    }

    // Event listener for reload button
    reloadButton.addEventListener('click', async (event) => {
        event.stopPropagation(); 
        while (notificationList.children.length > 1) { 
            notificationList.removeChild(notificationList.lastChild);
        }
        activeNotifications = {};
        viewedNotifications = {};
        localStorage.setItem('activeNotifications', JSON.stringify(activeNotifications));
        localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));

        // Fetch and process data again
        await fetchAndProcessData();

        // Ensure the notification list stays visible
        notificationList.style.display = 'block';
        notificationList.style.opacity = '1';
        notificationList.style.visibility = 'visible';
    });

    // Function to display active notifications
    function displayActiveNotifications() {
        Object.entries(activeNotifications).forEach(([cryptoName, messages]) => {
            addNotification(cryptoName, messages, 'market_cap', true);
        });
        updateNotificationDot();
    }

    // Initial display of active notifications
    displayActiveNotifications();

    // Show notification list on mouse enter
    notificationButton.addEventListener('mouseenter', () => {
        notificationList.style.display = 'block';
        notificationList.style.opacity = '1';
        notificationList.style.visibility = 'visible';
    });
    
    notificationList.addEventListener('mouseenter', () => {
        notificationList.style.opacity = '1';
        notificationList.style.visibility = 'visible';
    });

    notificationList.addEventListener('mouseleave', () => {
        notificationList.style.opacity = '0';
        notificationList.style.visibility = 'hidden';
        setTimeout(() => {
            if (notificationList.style.opacity === '0') {
                notificationList.style.display = 'none';
            }
        }, 300);
    });
});