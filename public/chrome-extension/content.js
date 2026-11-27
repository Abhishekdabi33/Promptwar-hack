(function () {
  const PATTERNS = {
    creditCard: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
    aadhaar: /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g,
    pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    phone: /(?:\+?(\d{1,3}))?[-. ]?\(?\d{2,4}\)?[-. ]?\d{3,4}[-. ]?\d{4}\b/g,
    ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    otp: /\b(?:otp|passcode|code)?[:\s-]*(\d{6})\b/gi
  };

  function validateLuhn(numStr) {
    const digits = numStr.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }

  function scanText(text) {
    if (!text || typeof text !== 'string') return [];
    const detected = [];

    const ccMatches = text.match(PATTERNS.creditCard) || [];
    for (const m of ccMatches) {
      if (validateLuhn(m)) {
        detected.push({ type: 'Credit Card', value: m });
      }
    }

    const aadhaarMatches = text.match(PATTERNS.aadhaar) || [];
    for (const m of aadhaarMatches) {
      detected.push({ type: 'Aadhaar', value: m });
    }

    const panMatches = text.match(PATTERNS.pan) || [];
    for (const m of panMatches) {
      detected.push({ type: 'PAN', value: m });
    }

    const emailMatches = text.match(PATTERNS.email) || [];
    for (const m of emailMatches) {
      detected.push({ type: 'Email', value: m });
    }

    const phoneMatches = text.match(PATTERNS.phone) || [];
    for (const m of phoneMatches) {
      if (m.replace(/\D/g, '').length >= 10) {
        detected.push({ type: 'Phone', value: m });
      }
    }

    const otpMatches = text.match(PATTERNS.otp) || [];
    for (const m of otpMatches) {
      detected.push({ type: 'OTP', value: m });
    }

    return detected;
  }

  function maskText(text) {
    let output = text;
    const detected = scanText(text);
    for (const item of detected) {
      output = output.replace(item.value, `[REDACTED_${item.type.toUpperCase().replace(/\s+/g, '_')}]`);
    }
    return output;
  }

  let activeBadge = null;

  function removeBadge() {
    if (activeBadge && activeBadge.parentNode) {
      activeBadge.parentNode.removeChild(activeBadge);
      activeBadge = null;
    }
  }

  function showBadge(targetElement, detectedList) {
    removeBadge();
    if (!detectedList.length) return;

    const rect = targetElement.getBoundingClientRect();
    const badge = document.createElement('div');
    badge.className = 'pii-shield-badge pii-shield-badge-warning';

    const count = detectedList.length;
    const types = Array.from(new Set(detectedList.map(d => d.type))).join(', ');

    badge.innerHTML = `
      <span>🛡️ ${count} PII found (${types})</span>
      <button type="button" class="pii-shield-btn" id="pii-shield-mask-btn">Mask & Protect</button>
      <button type="button" class="pii-shield-close" id="pii-shield-close-btn">&times;</button>
    `;

    const top = window.scrollY + rect.bottom + 6;
    const left = window.scrollX + Math.max(10, rect.left);
    badge.style.top = `${top}px`;
    badge.style.left = `${left}px`;

    document.body.appendChild(badge);
    activeBadge = badge;

    badge.querySelector('#pii-shield-mask-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (targetElement.isContentEditable) {
        targetElement.innerText = maskText(targetElement.innerText);
      } else {
        targetElement.value = maskText(targetElement.value);
      }
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      removeBadge();
    });

    badge.querySelector('#pii-shield-close-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeBadge();
    });
  }

  function handleInput(e) {
    const el = e.target;
    if (!el) return;
    const isText = el.tagName === 'TEXTAREA' || 
                   (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || el.type === 'email')) ||
                   el.isContentEditable;
    if (!isText) return;

    const val = el.isContentEditable ? el.innerText : el.value;
    const detected = scanText(val);
    if (detected.length > 0) {
      showBadge(el, detected);
    } else {
      removeBadge();
    }
  }

  document.addEventListener('input', handleInput, true);
  document.addEventListener('focusin', handleInput, true);
})();
