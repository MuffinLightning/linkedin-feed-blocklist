let isBlockingEnabled = false;
let keywords = [];

const filterContentByKeywords = (replace, targetNode) => {
    const spans = targetNode.querySelectorAll('span[dir="ltr"]');

    spans.forEach(span => {
        const directTextContent = Array.from(span.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.nodeValue)
            .join('')
            .toLowerCase();

        const words = directTextContent.split(/\s+/).map(w => w.toLowerCase());
        const hasKeyword = words.some(word => keywords.includes(word));

        if (hasKeyword) {
            let parent = span.parentElement;
            while (parent) {
                if (parent.tagName.toLowerCase() === 'div' && !parent.getAttribute('class')) {
                    parent.style.display = replace ? 'none' : '';
                    break;
                }
                parent = parent.parentElement;
            }
        }
    });
};

let observer;

const observeLinkedInFeed = () => {
    const feedSelector = '.scaffold-finite-scroll__content';
    const feed = document.querySelector(feedSelector);

    if (feed) {
        observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                Array.from(mutation.addedNodes).forEach(newNode => {
                    if (newNode.nodeType === Node.ELEMENT_NODE) {
                        filterContentByKeywords(isBlockingEnabled, newNode);
                        hideSuggestedDiv();
                    }
                });
            });
        });

        observer.observe(feed, { childList: true, subtree: true });
    }
};

const hideSuggestedDiv = () => {
    const spans = document.querySelectorAll('span.update-components-header__text-view');

    spans.forEach(span => {
        if (span.textContent.trim() === 'Suggested') {
            const parentDiv = span.closest('.update-components-header');
            if (parentDiv && parentDiv.parentElement) {
                parentDiv.parentElement.style.display = 'none';
            }
        }
    });
};

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.toggleBlock !== undefined) {
            isBlockingEnabled = request.toggleBlock;
            if (isBlockingEnabled) {
                filterContentByKeywords(true, document);
                hideSuggestedDiv();
                observeLinkedInFeed();
            } else if(observer) {
                observer.disconnect();
            }
        }
        if (request.updateKeywords !== undefined) {
            console.log("updating keywords", request.updateKeywords);
            keywords = request.updateKeywords;
            if (isBlockingEnabled) {
                filterContentByKeywords(true, document);
            }
        }
    }
);

// Initial setup: Fetch blocker status and keywords from storage
chrome.storage.local.get(['blockerEnabled', 'keywords'], (data) => {
    isBlockingEnabled = data.blockerEnabled || false;
    keywords = data.keywords || [];
    filterContentByKeywords(isBlockingEnabled, document);
    if (isBlockingEnabled) {
        observeLinkedInFeed();
    }
});
