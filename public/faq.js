document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const chatbotResponse = document.getElementById('chatbotResponse');
    const userQuestion = document.getElementById('userQuestion');
    
    // Create a wrapper div and suggestion span
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    const suggestionSpan = document.createElement('span');
    suggestionSpan.className = 'suggestion-span';
    
    // Replace the input with our wrapper structure
    userQuestion.parentNode.insertBefore(wrapper, userQuestion);
    wrapper.appendChild(userQuestion);
    wrapper.appendChild(suggestionSpan);

    let autocompleteSuggestions = [];
    let currentSuggestion = '';
    let debounceTimer = null;

    // Create a canvas element to calculate text width
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Function to calculate the width of the input text
    function getTextWidth(text, font) {
        context.font = font; 
        return context.measureText(text).width;
    }

    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function fetchSuggestions(query) {
        fetch(`/faq/suggestions?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(suggestions => {
                autocompleteSuggestions = suggestions;
                updateSuggestion(query);
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
            });
    }

    function updateSuggestion(query) {
        if (!query) {
            suggestionSpan.textContent = '';
            return;
        }

        // Find the first suggestion that starts with the current query
        const match = autocompleteSuggestions.find(
            suggestion => suggestion.toLowerCase().startsWith(query.toLowerCase())
        );

        if (match) {
            const remainingText = match.slice(query.length);
            suggestionSpan.textContent = remainingText;

            // Calculate the width of the typed text
            const font = window.getComputedStyle(userQuestion).font;
            const textWidth = getTextWidth(userQuestion.value, font);

            // Dynamically position the suggestion span to the right of the typed text
            suggestionSpan.style.left = `${textWidth + 10}px`; 
            currentSuggestion = match;
        } else {
            suggestionSpan.textContent = '';
            currentSuggestion = '';
        }
    }

    userQuestion.addEventListener('input', debounce(function(event) {
        const query = userQuestion.value.trim();

        if (query.length > 1) {
            fetchSuggestions(query);
        } else {
            suggestionSpan.textContent = '';
            currentSuggestion = '';
        }
    }, 300));

    // Handle tab key to accept suggestion
    userQuestion.addEventListener('keydown', function(event) {
        if (event.key === 'Tab' && currentSuggestion) {
            event.preventDefault();
            userQuestion.value = currentSuggestion;
            suggestionSpan.textContent = '';
        } else if (event.key === 'Enter') {
            event.preventDefault();
            fetchResponse();
        } else if (event.key === 'Escape') {
            suggestionSpan.textContent = '';
            currentSuggestion = '';
        }
    });

    // Fetch chatbot response from the backend
    function fetchResponse() {
        const questionText = userQuestion.value.trim();
        if (questionText !== '') {
            searchButton.classList.add('faded-out');
            chatbotResponse.style.display = 'block';
            chatbotResponse.textContent = '';
            chatbotResponse.style.height = 'auto';

            const loadingSpinner = document.createElement('div');
            loadingSpinner.classList.add('spinner');
            chatbotResponse.appendChild(loadingSpinner);

            fetch('/faq/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: questionText })
            })
            .then(response => response.json())
            .then(gptResponse => {
                chatbotResponse.removeChild(loadingSpinner);
                chatbotResponse.innerHTML = gptResponse.message;
                chatbotResponse.style.height = chatbotResponse.scrollHeight + "px";
                searchButton.classList.remove('faded-out');
            })
            .catch(error => {
                console.error('Error:', error);
                chatbotResponse.removeChild(loadingSpinner);
                chatbotResponse.textContent = 'An error occurred. Please try again later.';
                searchButton.classList.remove('faded-out');
            });
        } else {
            chatbotResponse.textContent = 'Please enter a valid question.';
            chatbotResponse.style.display = 'block';
        }
    }
});
