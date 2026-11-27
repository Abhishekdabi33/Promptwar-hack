document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('scan-input');
  const result = document.getElementById('scan-result');
  const openBtn = document.getElementById('open-app-btn');

  const PATTERNS = {
    creditCard: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
    aadhaar: /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g,
    pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    phone: /(?:\+?(\d{1,3}))?[-. ]?\(?\d{2,4}\)?[-. ]?\d{3,4}[-. ]?\d{4}\b/g
  };

  input.addEventListener('input', () => {
    const val = input.value;
    let count = 0;
    const types = [];

    for (const [key, pattern] of Object.entries(PATTERNS)) {
      const matches = val.match(pattern);
      if (matches) {
        count += matches.length;
        types.push(key);
      }
    }

    if (count > 0) {
      result.textContent = `⚠️ Detected ${count} item(s): ${types.join(', ')}`;
      result.style.color = '#DC2626';
      result.style.fontWeight = 'bold';
    } else {
      result.textContent = '0 sensitive entities detected.';
      result.style.color = '#475569';
      result.style.fontWeight = 'normal';
    }
  });

  openBtn.addEventListener('click', () => {
    if (chrome && chrome.tabs) {
      chrome.tabs.create({ url: 'http://localhost:5173' });
    } else {
      window.open('http://localhost:5173', '_blank');
    }
  });
});
