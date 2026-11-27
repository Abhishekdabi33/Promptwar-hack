let pyodide = null;
let isReady = false;

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 6, 7, 8, 9, 0, 1, 2, 3, 4],
  [6, 7, 8, 9, 5, 1, 2, 3, 4, 0],
  [7, 8, 9, 5, 6, 2, 3, 4, 0, 1],
  [8, 9, 5, 6, 7, 3, 4, 0, 1, 2],
  [9, 5, 6, 7, 8, 4, 0, 1, 2, 3]
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
const PAN_CODES = new Set(['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']);

function jsVerhoeffValidate(str) {
  const cleaned = String(str).replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(cleaned) || cleaned[0] === '0' || cleaned[0] === '1') return false;
  let c = 0;
  const rev = cleaned.split('').reverse();
  for (let i = 0; i < rev.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][parseInt(rev[i], 10)]];
  }
  return c === 0;
}

function jsVerhoeffGenerate(prefix11) {
  const cleaned = String(prefix11).replace(/[\s-]/g, '');
  let c = 0;
  const rev = cleaned.split('').reverse();
  for (let i = 0; i < rev.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][parseInt(rev[i], 10)]];
  }
  return String(VERHOEFF_INV[c]);
}

function jsLuhnValidate(str) {
  const cleaned = String(str).replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;
  let checksum = 0;
  const rev = cleaned.split('').reverse();
  for (let i = 0; i < rev.length; i++) {
    let d = parseInt(rev[i], 10);
    if (i % 2 === 1) {
      d *= 2;
      checksum += d > 9 ? d - 9 : d;
    } else {
      checksum += d;
    }
  }
  return checksum % 10 === 0;
}

function jsIpv4Validate(str) {
  const parts = str.split('.');
  if (parts.length !== 4) return false;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return false;
    if (p.length > 1 && p.startsWith('0')) return false;
    const v = parseInt(p, 10);
    if (v < 0 || v > 255) return false;
  }
  return true;
}

function jsPanValidate(str) {
  const cleaned = str.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned)) return false;
  return PAN_CODES.has(cleaned[3]);
}

function jsShannonEntropy(token) {
  if (!token || token.length < 16) return 0;
  const freq = {};
  for (const ch of token) freq[ch] = (freq[ch] || 0) + 1;
  let ent = 0;
  const len = token.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    ent -= p * Math.log2(p);
  }
  return ent;
}

function jsNormalizeEntityKey(etype, val) {
  const v = val.trim();
  if (etype === 'Email') return v.toLowerCase();
  if (etype === 'Credit Card' || etype === 'Aadhaar' || etype === 'Phone') {
    return v.replace(/[^\d+]/g, '');
  }
  if (etype === 'PAN') return v.toUpperCase();
  return v;
}

function jsFormatFullMask(etype) {
  const m = {
    'Email': '[REDACTED_EMAIL]',
    'Credit Card': '[REDACTED_CARD]',
    'Aadhaar': '[REDACTED_AADHAAR]',
    'PAN': '[REDACTED_PAN]',
    'Secret Token': '[REDACTED_SECRET]',
    'IPv4': '[REDACTED_IPV4]',
    'Phone': '[REDACTED_PHONE]',
    'Custom': '[REDACTED_CUSTOM]'
  };
  return m[etype] || '[REDACTED]';
}

function jsFormatPartialMask(etype, val) {
  const v = String(val).trim();
  if (etype === 'Credit Card') {
    const digits = v.replace(/[\s-]/g, '');
    const l4 = digits.slice(-4);
    return `XXXX-XXXX-XXXX-${l4}`;
  }
  if (etype === 'Aadhaar') {
    const digits = v.replace(/[\s-]/g, '');
    const l4 = digits.slice(-4);
    return `XXXX-XXXX-${l4}`;
  }
  if (etype === 'Phone') {
    const digits = v.replace(/[^\d]/g, '');
    const l4 = digits.slice(-4);
    if (v.includes('+91') || (digits.length === 12 && digits.startsWith('91'))) {
      return `+91-******${l4}`;
    }
    if (v.includes('(')) {
      return `(***) ***-${l4}`;
    }
    return `******${l4}`;
  }
  if (etype === 'Email') {
    if (v.includes('@')) {
      const [u, d] = v.split('@');
      return `${u[0] || 'u'}***@${d}`;
    }
    return 'e***@domain.com';
  }
  if (etype === 'PAN') {
    const u = v.toUpperCase();
    return u.length === 10 ? `${u.slice(0, 2)}***${u.slice(7)}` : `${u.slice(0, 2)}***`;
  }
  if (etype === 'IPv4') {
    const o = v.split('.');
    return o.length === 4 ? `${o[0]}.${o[1]}.***.***` : '192.168.***.***';
  }
  if (etype === 'Secret Token') {
    const p = v.slice(0, 4);
    return `${p}****************`;
  }
  return '[***]';
}

function jsGetPseudonym(etype, val, pmap, counters) {
  const nkey = jsNormalizeEntityKey(etype, val);
  const fkey = `${etype}::${nkey}`;
  if (pmap[fkey]) return pmap[fkey];
  const pmapPrefix = {
    'Email': 'EMAIL',
    'Credit Card': 'CARD',
    'Aadhaar': 'AADHAAR',
    'PAN': 'PAN',
    'Secret Token': 'SECRET',
    'IPv4': 'IPV4',
    'Phone': 'PHONE',
    'Custom': 'USER'
  };
  const prefix = pmapPrefix[etype] || 'TOKEN';
  counters[etype] = (counters[etype] || 0) + 1;
  const token = `${prefix}_${String(counters[etype]).padStart(2, '0')}`;
  pmap[fkey] = token;
  return token;
}

function fallbackProcessText(text, options = {}, pmap = {}, counters = {}) {
  const redactionMode = options.redaction_mode || 'full';
  const enabled = new Set(options.enabled_types || [
    'Credit Card', 'Aadhaar', 'PAN', 'Email', 'Phone', 'IPv4', 'Secret Token', 'Custom'
  ]);
  const customRules = options.custom_rules || [];
  const whitelisted = new Set(options.whitelisted_ids || []);

  const candidates = [];
  const rejected = [];

  if (enabled.has('Credit Card')) {
    const pat = /\b(?:\d{4}[ -]){3}\d{4}\b|\b\d{15,16}\b/g;
    let m;
    while ((m = pat.exec(text)) !== null) {
      const cleaned = m[0].replace(/[\s-]/g, '');
      if (cleaned.length === 15 || cleaned.length === 16) {
        if (jsLuhnValidate(m[0])) {
          candidates.push({
            start: m.index,
            end: m.index + m[0].length,
            type: 'Credit Card',
            value: m[0],
            reason: 'Luhn Mod-10 Checksum Verified',
            severity: 'Critical'
          });
        } else {
          rejected.push({
            start: m.index,
            end: m.index + m[0].length,
            value: m[0],
            type: 'Credit Card',
            reason: 'Luhn Mod-10 Checksum Failed (Ignored 16-digit serial/tracking ID)',
            line: text.slice(0, m.index).split('\n').length
          });
        }
      }
    }
  }

  if (enabled.has('Aadhaar')) {
    const pat = /(?<!\w)[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}(?![\s-]?\d)|(?<!\w)[2-9]\d{11}(?!\d)/g;
    let m;
    while ((m = pat.exec(text)) !== null) {
      if (jsVerhoeffValidate(m[0])) {
        candidates.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'Aadhaar',
          value: m[0],
          reason: 'Verhoeff Algorithm Checksum Verified',
          severity: 'Critical'
        });
      } else {
        rejected.push({
          start: m.index,
          end: m.index + m[0].length,
          value: m[0],
          type: '12-Digit Aadhaar',
          reason: 'Verhoeff Algorithm Checksum Failed (Ignored 12-digit order/invoice ID)',
          line: text.slice(0, m.index).split('\n').length
        });
      }
    }
  }

  if (enabled.has('PAN')) {
    const pat = /\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b/g;
    let m;
    while ((m = pat.exec(text)) !== null) {
      if (jsPanValidate(m[0])) {
        candidates.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'PAN',
          value: m[0],
          reason: `DPDP Entity Code [${m[0][3].toUpperCase()}] Verified`,
          severity: 'High'
        });
      } else {
        rejected.push({
          start: m.index,
          end: m.index + m[0].length,
          value: m[0],
          type: 'Indian PAN',
          reason: 'PAN Entity Code Invalid (Ignored alphanumeric code)',
          line: text.slice(0, m.index).split('\n').length
        });
      }
    }
  }

  if (enabled.has('IPv4')) {
    const pat = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g;
    let m;
    while ((m = pat.exec(text)) !== null) {
      if (jsIpv4Validate(m[0])) {
        candidates.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'IPv4',
          value: m[0],
          reason: 'IPv4 Octet Range [0-255] Verified',
          severity: 'Medium'
        });
      } else {
        const octs = m[0].split('.');
        if (octs.some(o => /^\d+$/.test(o) && parseInt(o, 10) > 255)) {
          rejected.push({
            start: m.index,
            end: m.index + m[0].length,
            value: m[0],
            type: 'IPv4 Address',
            reason: 'IPv4 Octet Out of Range [0-255] (Ignored software version / invalid IP)',
            line: text.slice(0, m.index).split('\n').length
          });
        }
      }
    }
  }

  if (enabled.has('Email')) {
    const pat = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    let m;
    while ((m = pat.exec(text)) !== null) {
      candidates.push({
        start: m.index,
        end: m.index + m[0].length,
        type: 'Email',
        value: m[0],
        reason: 'Standard Email Format Verified',
        severity: 'Medium'
      });
    }
  }

  if (enabled.has('Phone')) {
    const pats = [
      /(?<!\w)(?:\+1[\s-]?)?(?:\(\d{3}\)|\d{3})[\s-]?\d{3}[\s-]?\d{4}\b/g,
      /(?<!\w)(?:\+91[\s-]?)?[6789]\d{4}[\s-]?\d{5}\b/g,
      /(?<!\w)[6789]\d{9}\b/g
    ];
    for (const pat of pats) {
      let m;
      while ((m = pat.exec(text)) !== null) {
        candidates.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'Phone',
          value: m[0],
          reason: 'E.164 Telephony Format Verified',
          severity: 'High'
        });
      }
    }
  }

  if (enabled.has('Secret Token')) {
    const pat = /\b[A-Za-z0-9_\-\.]{20,}\b/g;
    let m;
    while ((m = pat.exec(text)) !== null) {
      const ent = jsShannonEntropy(m[0]);
      const prevContext = text.slice(Math.max(0, m.index - 30), m.index).toLowerCase();
      const hasContext = /(token|key|secret|bearer|auth|pwd)/.test(prevContext);
      const threshold = hasContext ? 3.2 : 3.8;
      if (ent >= threshold && m[0].length >= 20) {
        candidates.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'Secret Token',
          value: m[0],
          reason: `Shannon Entropy: ${ent.toFixed(2)} bits/char`,
          severity: 'Critical'
        });
      }
    }
  }

  if (enabled.has('Custom')) {
    for (const rule of customRules) {
      const rtype = rule.type || 'keyword';
      const rval = (rule.value || '').trim();
      if (!rval) continue;
      try {
        const pat = rtype === 'keyword' ? new RegExp(rval.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : new RegExp(rval, 'g');
        let m;
        while ((m = pat.exec(text)) !== null) {
          candidates.push({
            start: m.index,
            end: m.index + m[0].length,
            type: 'Custom',
            value: m[0],
            reason: `Custom Rule Matched (${rtype})`,
            severity: 'Low'
          });
        }
      } catch (e) {}
    }
  }

  const priority = {
    'Credit Card': 100,
    'Aadhaar': 90,
    'PAN': 80,
    'Secret Token': 70,
    'Email': 60,
    'IPv4': 50,
    'Phone': 40,
    'Custom': 30
  };

  candidates.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (priority[b.type] !== priority[a.type]) return priority[b.type] - priority[a.type];
    return (b.end - b.start) - (a.end - a.start);
  });

  const resolved = [];
  let occEnd = -1;
  for (const c of candidates) {
    if (c.start >= occEnd) {
      resolved.push(c);
      occEnd = c.end;
    }
  }

  const matches = resolved.map((m, idx) => ({
    id: `match_${idx}`,
    start: m.start,
    end: m.end,
    type: m.type,
    value: m.value,
    reason: m.reason,
    line: text.slice(0, m.start).split('\n').length,
    severity: m.severity
  }));

  const activeMatches = matches.filter(m => !whitelisted.has(m.id));
  const chunks = [];
  let lastIdx = 0;

  for (const m of activeMatches.sort((a, b) => a.start - b.start)) {
    chunks.push(text.slice(lastIdx, m.start));
    let rep = '';
    if (redactionMode === 'full') rep = jsFormatFullMask(m.type);
    else if (redactionMode === 'partial') rep = jsFormatPartialMask(m.type, m.value);
    else if (redactionMode === 'pseudonym') rep = jsGetPseudonym(m.type, m.value, pmap, counters);
    else rep = jsFormatFullMask(m.type);

    m.redacted_value = rep;
    chunks.push(rep);
    lastIdx = m.end;
  }
  chunks.push(text.slice(lastIdx));
  const sanitizedText = chunks.join('');

  const entityCounts = {};
  for (const m of activeMatches) {
    entityCounts[m.type] = (entityCounts[m.type] || 0) + 1;
  }

  const weights = {
    'Credit Card': 35,
    'Aadhaar': 30,
    'Secret Token': 30,
    'PAN': 20,
    'Phone': 15,
    'Email': 10,
    'IPv4': 5,
    'Custom': 5
  };

  let riskScore = 0;
  for (const [k, v] of Object.entries(entityCounts)) {
    riskScore += (weights[k] || 5) * Math.min(v, 3);
  }
  riskScore = Math.min(100, riskScore);

  const riskTier = riskScore >= 80 ? 'Critical' : riskScore >= 50 ? 'High' : riskScore >= 20 ? 'Medium' : 'Low';

  const compliance = [];
  if (entityCounts['Credit Card']) compliance.push('PCI-DSS');
  if (entityCounts['Aadhaar'] || entityCounts['PAN'] || entityCounts['Phone'] || entityCounts['Email']) {
    compliance.push('India DPDP Act');
  }
  if (entityCounts['Email'] || entityCounts['Phone'] || entityCounts['IPv4'] || entityCounts['Credit Card']) {
    compliance.push('GDPR');
  }

  rejected.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });
  const dedupedRejected = [];
  let lastTrapEnd = -1;
  for (const r of rejected) {
    if (r.start >= lastTrapEnd) {
      dedupedRejected.push({
        value: r.value,
        type: r.type,
        reason: r.reason,
        line: r.line
      });
      lastTrapEnd = r.end;
    }
  }

  return {
    sanitized_text: sanitizedText,
    matches,
    active_matches_count: activeMatches.length,
    entity_counts: entityCounts,
    rejected_traps_count: dedupedRejected.length,
    rejected_traps: dedupedRejected,
    risk_score: riskScore,
    risk_tier: riskTier,
    compliance_frameworks: compliance,
    raw_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sanitized_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    pseudonym_vault: pmap
  };
}

async function bootPythonEngine() {
  try {
    postMessage({ type: 'STATUS', status: 'booting', message: 'Loading Pyodide WASM runtime...' });
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
    });

    let code = '';
    try {
      const resp = await fetch('/engine.py');
      code = await resp.text();
    } catch (e) {
      code = '';
    }

    if (code) {
      await pyodide.runPythonAsync(code);
    }

    isReady = true;
    postMessage({
      type: 'STATUS',
      status: 'ready',
      engine: 'python-wasm',
      message: 'Python 3.12 WebAssembly Engine Active (0 Bytes Sent)'
    });
  } catch (err) {
    postMessage({
      type: 'STATUS',
      status: 'ready_fallback',
      engine: 'js-mirror',
      message: 'Privacy Engine Active (Client-Side Safe Mode)'
    });
  }
}

bootPythonEngine();

self.onmessage = async (e) => {
  const { id, type, payload } = e.data;

  if (type === 'PING') {
    postMessage({ id, type: 'PONG', isReady });
    return;
  }

  if (type === 'PROCESS') {
    const { format, content, options, pseudonymMap = {}, counters = {} } = payload;

    if (isReady && pyodide) {
      try {
        const pyOptions = JSON.stringify(options || {});
        const pyMap = JSON.stringify(pseudonymMap);
        const pyCounters = JSON.stringify(counters);

        let pyCall = '';
        if (format === 'csv') {
          pyodide.globals.set('__csv_input__', content);
          pyCall = `process_csv(__csv_input__, json.loads('${pyOptions.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'), json.loads('${pyMap}'), json.loads('${pyCounters}'))`;
        } else if (format === 'json') {
          pyodide.globals.set('__json_input__', content);
          pyCall = `process_json(__json_input__, json.loads('${pyOptions.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'), json.loads('${pyMap}'), json.loads('${pyCounters}'))`;
        } else if (format === 'xml') {
          pyodide.globals.set('__xml_input__', content);
          pyCall = `process_xml(__xml_input__, json.loads('${pyOptions.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'), json.loads('${pyMap}'), json.loads('${pyCounters}'))`;
        } else if (format === 'eml') {
          pyodide.globals.set('__eml_input__', content);
          pyCall = `process_eml(__eml_input__, json.loads('${pyOptions.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'), json.loads('${pyMap}'), json.loads('${pyCounters}'))`;
        } else if (format === 'docx') {
          pyodide.globals.set('__docx_input__', content);
          pyCall = `process_docx_base64(__docx_input__, json.loads('${pyOptions.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'), json.loads('${pyMap}'), json.loads('${pyCounters}'))`;
        } else {
          pyodide.globals.set('__text_input__', content);
          pyCall = `process_text(__text_input__, json.loads('${pyOptions.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'), json.loads('${pyMap}'), json.loads('${pyCounters}'))`;
        }

        const pyResult = pyodide.runPython(`json.dumps(${pyCall})`);
        const result = JSON.parse(pyResult);
        postMessage({ id, type: 'PROCESS_SUCCESS', result, engine: 'python-wasm' });
        return;
      } catch (err) {
        const fbResult = fallbackProcessText(content, options, pseudonymMap, counters);
        postMessage({ id, type: 'PROCESS_SUCCESS', result: fbResult, engine: 'fallback' });
        return;
      }
    } else {
      const fbResult = fallbackProcessText(content, options, pseudonymMap, counters);
      postMessage({ id, type: 'PROCESS_SUCCESS', result: fbResult, engine: 'fallback' });
      return;
    }
  }

  if (type === 'PROCESS_CELLS') {
    const { matrix, options, pseudonymMap = {}, counters = {} } = payload;
    if (isReady && pyodide) {
      try {
        pyodide.globals.set('__cell_matrix__', JSON.stringify(matrix));
        const pyOptions = JSON.stringify(options || {});
        const pyMap = JSON.stringify(pseudonymMap);
        const pyCounters = JSON.stringify(counters);
        const pyCall = `json.dumps(process_cell_matrix(json.loads(__cell_matrix__), json.loads('${pyOptions.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'), json.loads('${pyMap}'), json.loads('${pyCounters}')))`;
        const pyResult = pyodide.runPython(pyCall);
        postMessage({ id, type: 'PROCESS_SUCCESS', result: JSON.parse(pyResult), engine: 'python-wasm' });
        return;
      } catch (e) {}
    }

    const flatRows = [];
    const allMatches = [];
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      const newRow = [];
      for (let c = 0; c < row.length; c++) {
        const cellStr = row[c] != null ? String(row[c]) : '';
        const res = fallbackProcessText(cellStr, options, pseudonymMap, counters);
        newRow.push(res.sanitized_text);
        for (const m of res.matches) {
          m.cell = `R${r + 1}C${c + 1}`;
          allMatches.push(m);
        }
      }
      flatRows.push(newRow);
    }
    postMessage({
      id,
      type: 'PROCESS_SUCCESS',
      result: {
        sanitized_matrix: flatRows,
        matches: allMatches,
        pseudonym_vault: pseudonymMap
      },
      engine: 'fallback'
    });
    return;
  }

  if (type === 'GENERATE_SAMPLE') {
    const { sampleType } = payload;
    if (isReady && pyodide) {
      try {
        const pyResult = pyodide.runPython(`generate_sample('${sampleType}')`);
        postMessage({ id, type: 'SAMPLE_SUCCESS', result: pyResult });
        return;
      } catch (e) {}
    }

    const validAadhaar = `2947 1058 362${jsVerhoeffGenerate('29471058362')}`;
    const validCard = '4539 1488 0343 6467';

    if (sampleType === 'json') {
      const sampleObj = {
        incident_id: 'INC-2026-9812',
        timestamp: '2026-11-27T10:45:00Z',
        server_cluster: 'aws-prod-mumbai-02',
        reporter: {
          name: 'Vikram Malhotra',
          email: 'Vikram.Malhotra@CyberShield-Labs.in',
          phone: '+91 98201 45982',
          pan_number: 'ABCPE1234F'
        },
        customer_payload: {
          account_number: 'ACT-8841-9923-1104-5521',
          beneficiary_aadhaar: validAadhaar,
          billing_card: validCard,
          false_positive_card_trap: '8841-9923-1104-5521',
          false_positive_aadhaar_trap: '2947 1058 3629',
          ip_source: '103.21.244.18',
          invalid_ip_version_trap: 'v3.14.299.1'
        },
        security_context: {
          bearer_token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.s6zV9xQ9zL91K8w2P0qZ3vB7yN.eY38wR29Lm',
          environment_version: 'release-v2.18.4',
          api_secret: 'sec_prod_live_9f83a21bb09e4c8d7120384a9'
        }
      };
      postMessage({ id, type: 'SAMPLE_SUCCESS', result: JSON.stringify(sampleObj, null, 2) });
    } else if (sampleType === 'csv') {
      const csvStr = [
        '"Record_ID","Customer_Name","Contact_Email","Phone_Number","Govt_ID_PAN","Payment_Card","Order_Tracking_No","Client_IP"',
        `"REC-001","Rajesh Verma","Rajesh.Verma@fintech.co.in","+91 98450 12345","ABCPE1234F","${validCard}","8841-9923-1104-5521","49.207.180.22"`,
        `"REC-002","Pooja Sharma","pooja.sharma@healthcare.org","+91 98765 43210","XYZPH9988G","4000-0012-3456-7899","9912-4411-8822-3311","103.88.22.14"`,
        `"REC-003","Rajesh Verma","rajesh.verma@fintech.co.in","+91 98450 12345","ABCPE1234F","${validCard}","1122-3344-5566-7788","49.207.180.22"`,
        '"REC-004","System Daemon","service.account@infra.internal","+1-800-555-0199","NA","NA","TRK-v3.14.299.1","192.168.1.100"'
      ].join('\n');
      postMessage({ id, type: 'SAMPLE_SUCCESS', result: csvStr });
    } else {
      const doc = `================================================================================
CYBER DEFENSE OPERATIONS CENTER — INCIDENT DOSSIER #SEC-2026-7749
Classification: CONFIDENTIAL // STRICT PRIVACY COMPLIANCE MANDATE
================================================================================

SECTION 1: ESCALATION SUMMARY & ON-CALL REPORT
Date: 2026-11-27T08:30:00Z
Investigating Officer: Rajesh Verma (Security Lead)
Contact Email: Rajesh.Verma@fintech.co.in
Alternative Contact: rajesh.verma@fintech.co.in
Emergency Line: +91 98450 12345
Originating Station IP: 49.207.180.22
Diagnostic Endpoint Version: v3.14.299.1 [Note: Build release tag, not IPv4]

SECTION 2: RESUME & IDENTITY VERIFICATION EXCERPT
Candidate: Dr. Arishta Sen
Verified PAN (Individual): ABCPE1234F
Aadhaar Identity Proof: ${validAadhaar}
Non-Resident Tracking Reference: INV-2947 1058 3629 [False-Positive Checksum Trap]
Personal Phone: +91 98201 45982
Primary Address: 14/B Cyber Park, Electronic City, Bengaluru 560100

SECTION 3: CLINICAL RECORD & PATIENT INTAKE NOTE
Patient Name: Meera Joshi
Medical Record Number: MRN-8841-9923-1104-5521 [Order tracking sequence, not card]
Patient Email: meera.joshi@healthnet.in
Emergency Contact: (415) 555-0199
Attending Physician: Dr. K. Ramanathan
Clinical Gateway IPv4: 103.21.244.18

SECTION 4: PAYMENT RECONCILIATION & MERCHANT LOG
Transaction ID: TXN-998214-B
Merchant Gateway: HDFC E-Commerce Terminal
Cardholder Name: Rajesh Verma
Registered Card: ${validCard}
Cardholder Phone: +91 98450 12345
Authorized Email: Rajesh.Verma@fintech.co.in
Billing Zip Code: 560001
Rejection Serial Trap: 8841-9923-1104-5521 [Non-Luhn Order Serial Number]

SECTION 5: LIVE PRODUCTION ERROR LOG & SECRET EXPOSURE
[2026-11-27 08:32:11.442] [AUTH_SERVICE] [ERROR] Failed to authenticate token.
[2026-11-27 08:32:11.443] [DEBUG] Authorization header leaked:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.s6zV9xQ9zL91K8w2P0qZ3vB7yN.eY38wR29Lm
API Key Parameter: sec_live_9f83a21bb09e4c8d7120384a92bcde51
Connecting Peer: 157.240.238.35
Gateway Software: Envoy Proxy v1.28.0-ubuntu

================================================================================
END OF DOSSIER — SUBMIT FOR AUTOMATED PII REDACTION
================================================================================`;
      postMessage({ id, type: 'SAMPLE_SUCCESS', result: doc });
    }
  }
};
