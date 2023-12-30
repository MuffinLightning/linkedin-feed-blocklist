document.addEventListener('DOMContentLoaded', () => {
    let toggleButton = document.getElementById('toggleButton');
    let statusDiv = document.getElementById('status');
    let addKeywordButton = document.getElementById('addKeyword');
    let keywordInput = document.getElementById('keywordInput');
    let keywordList = document.getElementById('keywordList');

    const updateButtonAndStatus = (isEnabled) => {
        statusDiv.textContent = `Status: ${isEnabled ? 'On' : 'Off'}`;
    };

    const updateKeywordList = (keywords) => {
        keywordList.innerHTML = '';
        keywords.forEach((keyword, index) => {
            let li = document.createElement('li');
            li.textContent = keyword;

            // Add a remove button for each keyword
            let removeButton = document.createElement('span');
            removeButton.textContent = 'Remove';
            removeButton.classList.add('removeKeyword');
            removeButton.onclick = () => removeKeyword(index);
            li.appendChild(removeButton);

            keywordList.appendChild(li);
        });
    };

    const removeKeyword = (index) => {
        chrome.storage.local.get('keywords', (data) => {
            let keywords = data.keywords || [];
            keywords.splice(index, 1);
            chrome.storage.local.set({'keywords': keywords}, () => {
                updateKeywordList(keywords);
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {updateKeywords: keywords});
                });
            });
        });
    };

    chrome.storage.local.get(['blockerEnabled', 'keywords'], (data) => {
        updateButtonAndStatus(data.blockerEnabled);
        updateKeywordList(data.keywords || []);
    });

    toggleButton.addEventListener('click', () => {
        chrome.storage.local.get('blockerEnabled', (data) => {
            let newState = !data.blockerEnabled;
            chrome.storage.local.set({'blockerEnabled': newState}, () => {
                updateButtonAndStatus(newState);
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {toggleBlock: newState});
                });
            });
        });
    });

    addKeywordButton.addEventListener('click', () => {
        let newKeyword = keywordInput.value.trim().toLowerCase();
        if(newKeyword) {
            chrome.storage.local.get('keywords', (data) => {
                let keywords = data.keywords || [];
                keywords.push(newKeyword);
                chrome.storage.local.set({'keywords': keywords}, () => {
                    updateKeywordList(keywords);
                    keywordInput.value = '';
                    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                        chrome.tabs.sendMessage(tabs[0].id, {updateKeywords: keywords});
                    });
                });
            });
        }
    });
});