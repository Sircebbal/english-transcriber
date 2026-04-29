const micBtn = document.getElementById('micBtn');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const chunkText = document.getElementById('chunkText');
const placeholder = document.getElementById('placeholder');
const wordCount = document.getElementById('wordCount');
const timerEl = document.getElementById('timer');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new SpeechRecognition();
rec.continuous = true;
rec.interimResults = true;
rec.lang = 'en-US';

let isListening = false;
let fullTranscript = '';
let currentChunk = '';
let chunkTimer = null;
let fadeTimer = null;
let seconds = 0;
let clockInterval = null;

const DISPLAY_DURATION = 4000;
const FADE_DURATION = 600;

function startClock() {
  clockInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    timerEl.textContent = m + ':' + s;
  }, 1000);
}

function stopClock() {
  clearInterval(clockInterval);
}

function showChunk(text) {
  clearTimeout(chunkTimer);
  clearTimeout(fadeTimer);

  chunkText.classList.remove('fade-out');
  chunkText.textContent = text;
  placeholder.style.display = 'none';

  chunkTimer = setTimeout(() => {
    chunkText.classList.add('fade-out');
    fadeTimer = setTimeout(() => {
      chunkText.textContent = '';
      chunkText.classList.remove('fade-out');
    }, FADE_DURATION);
  }, DISPLAY_DURATION);
}

function updateWordCount() {
  const count = fullTranscript.trim().split(/\s+/).filter(Boolean).length;
  wordCount.textContent = count ? count + ' words' : '';
}

micBtn.addEventListener('click', () => {
  if (!isListening) {
    rec.start();
  } else {
    rec.stop();
    stopClock();
    isListening = false;
    micBtn.textContent = '🎙 Start';
    micBtn.classList.remove('active');
    statusDot.className = 'dot';
    status.textContent = 'Stopped';
  }
});

rec.onstart = () => {
  isListening = true;
  micBtn.textContent = '⏹ Stop';
  micBtn.classList.add('active');
  statusDot.className = 'dot listening';
  status.textContent = 'Listening...';
  if (seconds === 0) startClock();
};

// Auto-restart when Chrome cuts off
rec.onend = () => {
  if (isListening) {
    rec.start();
  }
};

rec.onresult = (e) => {
  let interim = '';
  let newFinal = '';

  for (let i = e.resultIndex; i < e.results.length; i++) {
    const transcript = e.results[i][0].transcript;
    if (e.results[i].isFinal) {
      newFinal += transcript + ' ';
    } else {
      interim += transcript;
    }
  }

  if (newFinal) {
    fullTranscript += newFinal;
    currentChunk = newFinal.trim();
    showChunk(currentChunk);
    updateWordCount();
  } else if (interim) {
    chunkText.textContent = interim;
    placeholder.style.display = 'none';
  }
};

rec.onerror = (e) => {
  if (e.error === 'no-speech') return;
  status.textContent = 'Error: ' + e.error;
};

saveBtn.addEventListener('click', () => {
  if (!fullTranscript.trim()) return;

  const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const filename = 'lesson-' + date + '.txt';
  const blob = new Blob([fullTranscript.trim()], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});