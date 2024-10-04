document.addEventListener('DOMContentLoaded', function() {
    const questionDropdown = document.getElementById('faqQuestion');
    const searchButton = document.getElementById('searchButton');
    const chatbotResponse = document.getElementById('chatbotResponse');

    function fetchResponse() {
        const selectedQuestion = questionDropdown.value.trim();

        if (selectedQuestion !== '' && selectedQuestion !== 'What are you curious about?') {
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
                body: JSON.stringify({ prompt: selectedQuestion })
            })
            .then(response => response.text()) 
            .then(gptResponse => {
                chatbotResponse.removeChild(loadingSpinner);
                
                chatbotResponse.textContent = gptResponse;
                chatbotResponse.style.height = 'auto';
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
            chatbotResponse.textContent = 'Please select a valid question from the dropdown.';
            chatbotResponse.style.display = 'block';
        }
    }

    searchButton.addEventListener('click', function() {
        fetchResponse();
    });

    questionDropdown.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            fetchResponse();
        }
    });
});
