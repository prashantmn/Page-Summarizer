document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('generateSummary');
  const playButton = document.getElementById('playButton');
  const stopButton = document.getElementById('stopButton');
  const askButton = document.getElementById('askButton');
  const summaryDiv = document.getElementById('summary');
  const chatInput = document.getElementById('chatInput');
  const chatResponse = document.getElementById('chatResponse');
  const bulletPointsInput = document.getElementById('bulletPoints');

  let utterance = null;

  generateButton.addEventListener('click', generateSummary);
  playButton.addEventListener('click', playSummary);
  stopButton.addEventListener('click', stopSummary);
  askButton.addEventListener('click', askQuestion);

  // Check the summary status when the popup is opened
  chrome.storage.local.get(['summaryStatus', 'summary', 'error'], (result) => {
    if (result.summaryStatus === 'inProgress') {
      summaryDiv.innerHTML = 'Generating summary...';
      generateButton.disabled = true;
    } else if (result.summaryStatus === 'complete') {
      summaryDiv.innerHTML = result.summary;
      playButton.disabled = false;
      stopButton.disabled = true;
    } else if (result.summaryStatus === 'error') {
      summaryDiv.innerHTML = `<p style="color: red;">${result.error}</p>`;
      playButton.disabled = true;
      stopButton.disabled = true;
    }
  });

  function generateSummary() {
    const numBulletPoints = parseInt(bulletPointsInput.value);
    summaryDiv.innerHTML = 'Generating summary...';
    generateButton.disabled = true;
    chrome.runtime.sendMessage({ action: "getSummary", numBulletPoints: numBulletPoints }, (response) => {
      if (response.status === "inProgress") {
        summaryDiv.innerHTML = 'Summary generation is already in progress...';
      } else if (response && response.summary) {
        summaryDiv.innerHTML = response.summary;
        playButton.disabled = false;
        stopButton.disabled = true;
        generateButton.disabled = false;
      } else if (response && response.error) {
        summaryDiv.innerHTML = `<p style="color: red;">${response.error}</p>`;
        playButton.disabled = true;
        stopButton.disabled = true;
        generateButton.disabled = false;
      }
    });
  }

  function playSummary() {
    const summaryText = summaryDiv.innerText;
    utterance = new SpeechSynthesisUtterance(summaryText);
    utterance.rate = 0.8; // Adjust this value to control the speech rate (0.1 to 10)
    utterance.pitch = 1; // You can also adjust the pitch if needed (0 to 2)
    speechSynthesis.speak(utterance);
    playButton.disabled = true;
    stopButton.disabled = false;
  }

  function stopSummary() {
    if (utterance) {
      speechSynthesis.cancel();
      playButton.disabled = false;
      stopButton.disabled = true;
    }
  }

  function askQuestion() {
    const question = chatInput.value;
    chatResponse.textContent = 'Thinking...';
    chrome.runtime.sendMessage({ action: "askQuestion", question: question }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        chatResponse.textContent = `Error: ${chrome.runtime.lastError.message}`;
      } else if (response && response.answer) {
        chatResponse.textContent = response.answer;
      } else if (response && response.error) {
        chatResponse.textContent = response.error;
      }
    });
  }
});
