let currentTabId = null;
let isSummarizing = false;

chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTabId = activeInfo.tabId;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSummary") {
    if (isSummarizing) {
      sendResponse({ status: "inProgress" });
      return true;
    }
    
    isSummarizing = true;
    chrome.storage.local.set({ summaryStatus: "inProgress" });
    
    chrome.tabs.sendMessage(currentTabId, { action: "getPageContent" }, (response) => {
      if (chrome.runtime.lastError) {
        isSummarizing = false;
        chrome.storage.local.set({ summaryStatus: "error", error: chrome.runtime.lastError.message });
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      
      fetch('http://localhost:5000/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: response.pageContent,
          num_bullets: request.numBulletPoints
        }),
      })
      .then(response => response.json())
      .then(data => {
        isSummarizing = false;
        chrome.storage.local.set({ summaryStatus: "complete", summary: data.summary });
        sendResponse({ summary: data.summary });
      })
      .catch(error => {
        console.error('Error:', error);
        isSummarizing = false;
        chrome.storage.local.set({ summaryStatus: "error", error: 'Failed to generate summary' });
        sendResponse({ error: 'Failed to generate summary' });
      });
    });
    return true;
  } else if (request.action === "askQuestion") {
    chrome.tabs.sendMessage(currentTabId, { action: "getPageContent" }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      
      fetch('http://localhost:5000/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: response.pageContent,
          question: request.question
        }),
      })
      .then(response => response.json())
      .then(data => {
        sendResponse({ answer: data.answer });
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({ error: 'Failed to answer question' });
      });
    });
    return true;
  }
});
