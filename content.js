chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    sendResponse({ pageContent: document.body.innerText });
  }
  return true;
});
