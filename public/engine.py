import re
import csv
import io
import json
import hashlib
import math
import base64
import zipfile
import xml.etree.ElementTree as ET
import email
from email import policy

VERHOEFF_D = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
    (1, 2, 3, 4, 0, 6, 7, 8, 9, 5),
    (2, 3, 4, 0, 1, 7, 8, 9, 5, 6),
    (3, 4, 0, 1, 2, 8, 9, 5, 6, 7),
    (4, 0, 1, 2, 3, 9, 5, 6, 7, 8),
    (5, 6, 7, 8, 9, 0, 1, 2, 3, 4),
    (6, 7, 8, 9, 5, 1, 2, 3, 4, 0),
    (7, 8, 9, 5, 6, 2, 3, 4, 0, 1),
    (8, 9, 5, 6, 7, 3, 4, 0, 1, 2),
    (9, 5, 6, 7, 8, 4, 0, 1, 2, 3),
)

VERHOEFF_P = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
    (1, 5, 7, 6, 2, 8, 3, 0, 9, 4),
    (5, 8, 0, 3, 7, 9, 6, 1, 4, 2),
    (8, 9, 1, 6, 0, 4, 3, 5, 2, 7),
    (9, 4, 5, 3, 1, 2, 6, 8, 7, 0),
    (4, 2, 8, 6, 5, 7, 3, 9, 0, 1),
    (2, 7, 9, 3, 8, 0, 6, 4, 1, 5),
    (7, 0, 4, 6, 9, 1, 3, 2, 5, 8),
)

VERHOEFF_INV = (0, 4, 3, 2, 1, 5, 6, 7, 8, 9)

PAN_ENTITY_CODES = {'P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'}

PRIORITY_MAP = {
    'Credit Card': 100,
    'Aadhaar': 90,
    'PAN': 80,
    'Secret Token': 70,
    'Email': 60,
    'IPv4': 50,
    'Phone': 40,
    'Custom': 30
}

SEVERITY_MAP = {
    'Credit Card': 'Critical',
    'Aadhaar': 'Critical',
    'Secret Token': 'Critical',
    'PAN': 'High',
    'Phone': 'High',
    'Email': 'Medium',
    'IPv4': 'Medium',
    'Custom': 'Low'
}

WEIGHT_MAP = {
    'Credit Card': 35,
    'Aadhaar': 30,
    'Secret Token': 30,
    'PAN': 20,
    'Phone': 15,
    'Email': 10,
    'IPv4': 5,
    'Custom': 5
}

def verhoeff_validate(num_str):
    cleaned = re.sub(r'[\s-]', '', str(num_str))
    if not cleaned.isdigit() or len(cleaned) != 12 or cleaned[0] in ('0', '1'):
        return False
    c = 0
    for i, ch in enumerate(reversed(cleaned)):
        c = VERHOEFF_D[c][VERHOEFF_P[i % 8][int(ch)]]
    return c == 0

def verhoeff_generate(prefix_11_digits):
    cleaned = re.sub(r'[\s-]', '', str(prefix_11_digits))
    c = 0
    for i, ch in enumerate(reversed(cleaned)):
        c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][int(ch)]]
    return str(VERHOEFF_INV[c])

def luhn_validate(card_str):
    cleaned = re.sub(r'[\s-]', '', str(card_str))
    if not cleaned.isdigit() or len(cleaned) < 13 or len(cleaned) > 19:
        return False
    digits = [int(c) for c in cleaned]
    checksum = 0
    reversed_digits = digits[::-1]
    for i, d in enumerate(reversed_digits):
        if i % 2 == 1:
            doubled = d * 2
            checksum += (doubled - 9) if doubled > 9 else doubled
        else:
            checksum += d
    return checksum % 10 == 0

def luhn_generate(prefix_15_digits):
    cleaned = re.sub(r'[\s-]', '', str(prefix_15_digits))
    digits = [int(c) for c in cleaned]
    reversed_digits = digits[::-1]
    checksum = 0
    for i, d in enumerate(reversed_digits):
        if i % 2 == 0:
            doubled = d * 2
            checksum += (doubled - 9) if doubled > 9 else doubled
        else:
            checksum += d
    check_digit = (10 - (checksum % 10)) % 10
    return str(check_digit)

def ipv4_validate(ip_str):
    parts = ip_str.split('.')
    if len(parts) != 4:
        return False
    for p in parts:
        if not p.isdigit():
            return False
        if len(p) > 1 and p.startswith('0'):
            return False
        val = int(p)
        if val < 0 or val > 255:
            return False
    return True

def pan_validate(pan_str):
    cleaned = pan_str.strip().upper()
    if len(cleaned) != 10:
        return False
    if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', cleaned):
        return False
    return cleaned[3] in PAN_ENTITY_CODES

def calculate_shannon_entropy(token):
    if not token or len(token) < 16:
        return 0.0
    freq = {}
    for c in token:
        freq[c] = freq.get(c, 0) + 1
    entropy = 0.0
    total = len(token)
    for count in freq.values():
        p = count / total
        entropy -= p * math.log2(p)
    return entropy

def compute_sha256(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()

def normalize_entity_key(entity_type, val):
    v = val.strip()
    if entity_type == 'Email':
        return v.lower()
    if entity_type in ('Credit Card', 'Aadhaar', 'Phone'):
        return re.sub(r'[^\d+]', '', v)
    if entity_type == 'PAN':
        return v.upper()
    return v

def format_full_mask(entity_type):
    tag_map = {
        'Email': '[REDACTED_EMAIL]',
        'Credit Card': '[REDACTED_CARD]',
        'Aadhaar': '[REDACTED_AADHAAR]',
        'PAN': '[REDACTED_PAN]',
        'Secret Token': '[REDACTED_SECRET]',
        'IPv4': '[REDACTED_IPV4]',
        'Phone': '[REDACTED_PHONE]',
        'Custom': '[REDACTED_CUSTOM]'
    }
    return tag_map.get(entity_type, '[REDACTED]')

def format_partial_mask(entity_type, val):
    val_str = str(val).strip()
    if entity_type == 'Credit Card':
        digits = re.sub(r'[\s-]', '', val_str)
        last4 = digits[-4:] if len(digits) >= 4 else digits
        return f"XXXX-XXXX-XXXX-{last4}"
    if entity_type == 'Aadhaar':
        digits = re.sub(r'[\s-]', '', val_str)
        last4 = digits[-4:] if len(digits) >= 4 else digits
        return f"XXXX-XXXX-{last4}"
    if entity_type == 'Phone':
        digits = re.sub(r'[^\d]', '', val_str)
        last4 = digits[-4:] if len(digits) >= 4 else digits
        if '+91' in val_str or (len(digits) == 12 and digits.startswith('91')):
            return f"+91-******{last4}"
        return f"******{last4}"
    if entity_type == 'Email':
        if '@' in val_str:
            user_part, domain_part = val_str.split('@', 1)
            first_char = user_part[0] if user_part else 'u'
            return f"{first_char}***@{domain_part}"
        return "e***@domain.com"
    if entity_type == 'PAN':
        pan_clean = val_str.upper()
        if len(pan_clean) == 10:
            return f"{pan_clean[:2]}***{pan_clean[7:]}"
        return f"{pan_clean[:2]}***"
    if entity_type == 'IPv4':
        octets = val_str.split('.')
        if len(octets) == 4:
            return f"{octets[0]}.{octets[1]}.***.***"
        return "192.168.***.***"
    if entity_type == 'Secret Token':
        prefix = val_str[:4] if len(val_str) >= 4 else 'sec_'
        return f"{prefix}****************"
    return "[***]"

def get_or_create_pseudonym(entity_type, val, pseudonym_map, counters):
    norm_key = normalize_entity_key(entity_type, val)
    full_key = f"{entity_type}::{norm_key}"
    if full_key in pseudonym_map:
        return pseudonym_map[full_key]
    prefix_map = {
        'Email': 'EMAIL',
        'Credit Card': 'CARD',
        'Aadhaar': 'AADHAAR',
        'PAN': 'PAN',
        'Secret Token': 'SECRET',
        'IPv4': 'IPV4',
        'Phone': 'PHONE',
        'Custom': 'USER'
    }
    prefix = prefix_map.get(entity_type, 'TOKEN')
    counters[entity_type] = counters.get(entity_type, 0) + 1
    new_token = f"{prefix}_{counters[entity_type]:02d}"
    pseudonym_map[full_key] = new_token
    return new_token

class PIISanitizer:
    def __init__(self, options=None, pseudonym_map=None, counters=None):
        self.options = options or {}
        self.redaction_mode = self.options.get('redaction_mode', 'full')
        self.enabled_types = set(self.options.get('enabled_types', [
            'Credit Card', 'Aadhaar', 'PAN', 'Email', 'Phone', 'IPv4', 'Secret Token', 'Custom'
        ]))
        self.custom_rules = self.options.get('custom_rules', [])
        self.whitelisted_ids = set(self.options.get('whitelisted_ids', []))
        self.pseudonym_map = pseudonym_map if pseudonym_map is not None else {}
        self.counters = counters if counters is not None else {}
        self.rejected_traps = []

    def scan_spans(self, text):
        candidates = []
        rejected = []

        if 'Credit Card' in self.enabled_types:
            card_pattern = re.compile(r'\b(?:\d{4}[ -]?){3}\d{1,7}\b|\b\d{13,19}\b')
            for m in card_pattern.finditer(text):
                raw_val = m.group(0)
                cleaned = re.sub(r'[\s-]', '', raw_val)
                if 13 <= len(cleaned) <= 19:
                    if luhn_validate(raw_val):
                        candidates.append({
                            'start': m.start(),
                            'end': m.end(),
                            'type': 'Credit Card',
                            'value': raw_val,
                            'reason': 'Luhn Mod-10 Checksum Verified',
                            'severity': SEVERITY_MAP['Credit Card']
                        })
                    elif len(cleaned) == 16:
                        rejected.append({
                            'value': raw_val,
                            'reason': 'Luhn Mod-10 Checksum Failed (Ignored 16-digit order/tracking ID)',
                            'line': text[:m.start()].count('\n') + 1
                        })

        if 'Aadhaar' in self.enabled_types:
            aadhaar_pattern = re.compile(r'\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b')
            for m in aadhaar_pattern.finditer(text):
                raw_val = m.group(0)
                if verhoeff_validate(raw_val):
                    candidates.append({
                        'start': m.start(),
                        'end': m.end(),
                        'type': 'Aadhaar',
                        'value': raw_val,
                        'reason': 'Verhoeff Algorithm Checksum Verified',
                        'severity': SEVERITY_MAP['Aadhaar']
                    })
                else:
                    rejected.append({
                        'value': raw_val,
                        'reason': 'Verhoeff Checksum Failed (Ignored 12-digit invoice/serial ID)',
                        'line': text[:m.start()].count('\n') + 1
                    })

        if 'PAN' in self.enabled_types:
            pan_pattern = re.compile(r'\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b')
            for m in pan_pattern.finditer(text):
                raw_val = m.group(0)
                if pan_validate(raw_val):
                    candidates.append({
                        'start': m.start(),
                        'end': m.end(),
                        'type': 'PAN',
                        'value': raw_val,
                        'reason': f'DPDP Entity Code [{raw_val[3].upper()}] Verified',
                        'severity': SEVERITY_MAP['PAN']
                    })
                else:
                    rejected.append({
                        'value': raw_val,
                        'reason': 'PAN Entity Code Invalid (Ignored alphanumeric code)',
                        'line': text[:m.start()].count('\n') + 1
                    })

        if 'IPv4' in self.enabled_types:
            ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
            for m in ip_pattern.finditer(text):
                raw_val = m.group(0)
                if ipv4_validate(raw_val):
                    candidates.append({
                        'start': m.start(),
                        'end': m.end(),
                        'type': 'IPv4',
                        'value': raw_val,
                        'reason': 'IPv4 Octet Range [0-255] Verified',
                        'severity': SEVERITY_MAP['IPv4']
                    })
                else:
                    rejected.append({
                        'value': raw_val,
                        'reason': 'IPv4 Octet Out of Range (0-255) (Ignored software version / invalid IP)',
                        'line': text[:m.start()].count('\n') + 1
                    })

        if 'Email' in self.enabled_types:
            email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
            for m in email_pattern.finditer(text):
                raw_val = m.group(0)
                candidates.append({
                    'start': m.start(),
                    'end': m.end(),
                    'type': 'Email',
                    'value': raw_val,
                    'reason': 'Standard Email Format Verified',
                    'severity': SEVERITY_MAP['Email']
                })

        if 'Phone' in self.enabled_types:
            phone_patterns = [
                re.compile(r'(?:\+91[\s-]?)?[6789]\d{4}[\s-]?\d{5}\b'),
                re.compile(r'\b(?:\+1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b'),
                re.compile(r'\b[6789]\d{9}\b')
            ]
            for pat in phone_patterns:
                for m in pat.finditer(text):
                    raw_val = m.group(0)
                    candidates.append({
                        'start': m.start(),
                        'end': m.end(),
                        'type': 'Phone',
                        'value': raw_val,
                        'reason': 'E.164 Telephony Format Verified',
                        'severity': SEVERITY_MAP['Phone']
                    })

        if 'Secret Token' in self.enabled_types:
            secret_pattern = re.compile(r'(?i)(?:bearer\s+|api[_-]?key[:=\s]+|[a-z0-9_\-]{24,})')
            token_extractor = re.compile(r'\b[A-Za-z0-9_\-\.]{20,}\b')
            for m in token_extractor.finditer(text):
                raw_val = m.group(0)
                ent = calculate_shannon_entropy(raw_val)
                has_context = bool(re.search(r'(?i)(token|key|secret|bearer|auth|pwd)', text[max(0, m.start() - 30):m.start()]))
                threshold = 3.2 if has_context else 3.8
                if ent >= threshold and len(raw_val) >= 20:
                    candidates.append({
                        'start': m.start(),
                        'end': m.end(),
                        'type': 'Secret Token',
                        'value': raw_val,
                        'reason': f'Shannon Entropy: {ent:.2f} bits/char',
                        'severity': SEVERITY_MAP['Secret Token']
                    })

        if 'Custom' in self.enabled_types:
            for rule in self.custom_rules:
                rtype = rule.get('type', 'keyword')
                rval = rule.get('value', '').strip()
                if not rval:
                    continue
                try:
                    if rtype == 'keyword':
                        pat = re.compile(re.escape(rval), re.IGNORECASE)
                    else:
                        pat = re.compile(rval)
                    for m in pat.finditer(text):
                        candidates.append({
                            'start': m.start(),
                            'end': m.end(),
                            'type': 'Custom',
                            'value': m.group(0),
                            'reason': f'Custom Rule Matched ({rtype})',
                            'severity': SEVERITY_MAP['Custom']
                        })
                except Exception:
                    pass

        self.rejected_traps.extend(rejected)
        return candidates

    def resolve_overlaps(self, text, candidates):
        candidates.sort(key=lambda x: (
            x['start'],
            -PRIORITY_MAP.get(x['type'], 0),
            -(x['end'] - x['start'])
        ))

        resolved = []
        occupied_end = -1

        for c in candidates:
            if c['start'] >= occupied_end:
                resolved.append(c)
                occupied_end = c['end']
            else:
                pass

        final_matches = []
        for idx, m in enumerate(resolved):
            match_id = f"match_{idx}"
            line_no = text[:m['start']].count('\n') + 1
            entry = {
                'id': match_id,
                'start': m['start'],
                'end': m['end'],
                'type': m['type'],
                'value': m['value'],
                'reason': m['reason'],
                'line': line_no,
                'severity': m['severity']
            }
            final_matches.append(entry)

        return final_matches

    def sanitize(self, text):
        candidates = self.scan_spans(text)
        matches = self.resolve_overlaps(text, candidates)

        active_matches = [m for m in matches if m['id'] not in self.whitelisted_ids]

        chunks = []
        last_idx = 0

        for m in sorted(active_matches, key=lambda x: x['start']):
            chunks.append(text[last_idx:m['start']])
            etype = m['type']
            orig_val = m['value']

            if self.redaction_mode == 'full':
                replacement = format_full_mask(etype)
            elif self.redaction_mode == 'partial':
                replacement = format_partial_mask(etype, orig_val)
            elif self.redaction_mode == 'pseudonym':
                replacement = get_or_create_pseudonym(etype, orig_val, self.pseudonym_map, self.counters)
            else:
                replacement = format_full_mask(etype)

            m['redacted_value'] = replacement
            chunks.append(replacement)
            last_idx = m['end']

        chunks.append(text[last_idx:])
        sanitized_text = "".join(chunks)

        entity_counts = {}
        for m in active_matches:
            entity_counts[m['type']] = entity_counts.get(m['type'], 0) + 1

        weighted_risk = 0
        for etype, count in entity_counts.items():
            base_w = WEIGHT_MAP.get(etype, 5)
            weighted_risk += base_w * min(count, 3)

        risk_score = min(100, weighted_risk)
        if risk_score >= 80:
            risk_tier = 'Critical'
        elif risk_score >= 50:
            risk_tier = 'High'
        elif risk_score >= 20:
            risk_tier = 'Medium'
        else:
            risk_tier = 'Low'

        compliance_frameworks = []
        if 'Credit Card' in entity_counts:
            compliance_frameworks.append('PCI-DSS')
        if any(k in entity_counts for k in ('Aadhaar', 'PAN', 'Phone', 'Email')):
            compliance_frameworks.append('India DPDP Act')
        if any(k in entity_counts for k in ('Email', 'Phone', 'IPv4', 'Credit Card')):
            compliance_frameworks.append('GDPR')

        raw_hash = compute_sha256(text)
        sanitized_hash = compute_sha256(sanitized_text)

        result = {
            'sanitized_text': sanitized_text,
            'matches': matches,
            'active_matches_count': len(active_matches),
            'entity_counts': entity_counts,
            'rejected_traps_count': len(self.rejected_traps),
            'rejected_traps': self.rejected_traps,
            'risk_score': risk_score,
            'risk_tier': risk_tier,
            'compliance_frameworks': compliance_frameworks,
            'raw_sha256': raw_hash,
            'sanitized_sha256': sanitized_hash,
            'pseudonym_vault': self.pseudonym_map
        }
        return result

def process_text(text, options=None, pseudonym_map=None, counters=None):
    sanitizer = PIISanitizer(options, pseudonym_map, counters)
    return sanitizer.sanitize(text)

def process_csv(csv_text, options=None, pseudonym_map=None, counters=None):
    sanitizer = PIISanitizer(options, pseudonym_map, counters)
    in_stream = io.StringIO(csv_text)
    out_stream = io.StringIO()

    try:
        sample = csv_text[:4096]
        dialect = csv.Sniffer().sniff(sample)
    except Exception:
        dialect = csv.excel

    reader = csv.reader(in_stream, dialect=dialect)
    writer = csv.writer(out_stream, dialect=dialect)

    all_matches = []
    total_text_builder = []

    for row_idx, row in enumerate(reader):
        sanitized_row = []
        for col_idx, cell in enumerate(row):
            cell_res = sanitizer.sanitize(cell)
            sanitized_row.append(cell_res['sanitized_text'])
            for m in cell_res['matches']:
                m['cell'] = f"R{row_idx+1}C{col_idx+1}"
                all_matches.append(m)
        writer.writerow(sanitized_row)

    out_csv = out_stream.getvalue()
    raw_hash = compute_sha256(csv_text)
    san_hash = compute_sha256(out_csv)

    entity_counts = {}
    for m in all_matches:
        if m['id'] not in sanitizer.whitelisted_ids:
            entity_counts[m['type']] = entity_counts.get(m['type'], 0) + 1

    weighted_risk = sum(WEIGHT_MAP.get(k, 5) * min(v, 3) for k, v in entity_counts.items())
    risk_score = min(100, weighted_risk)
    risk_tier = 'Critical' if risk_score >= 80 else 'High' if risk_score >= 50 else 'Medium' if risk_score >= 20 else 'Low'

    compliance = []
    if 'Credit Card' in entity_counts:
        compliance.append('PCI-DSS')
    if any(k in entity_counts for k in ('Aadhaar', 'PAN', 'Phone', 'Email')):
        compliance.append('India DPDP Act')
    if any(k in entity_counts for k in ('Email', 'Phone', 'IPv4', 'Credit Card')):
        compliance.append('GDPR')

    return {
        'sanitized_text': out_csv,
        'matches': all_matches,
        'active_matches_count': sum(entity_counts.values()),
        'entity_counts': entity_counts,
        'rejected_traps_count': len(sanitizer.rejected_traps),
        'rejected_traps': sanitizer.rejected_traps,
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'compliance_frameworks': compliance,
        'raw_sha256': raw_hash,
        'sanitized_sha256': san_hash,
        'pseudonym_vault': sanitizer.pseudonym_map
    }

def process_json(json_text, options=None, pseudonym_map=None, counters=None):
    sanitizer = PIISanitizer(options, pseudonym_map, counters)
    parsed = json.loads(json_text)
    all_matches = []

    def recursive_sanitize(obj, path=""):
        if isinstance(obj, str):
            res = sanitizer.sanitize(obj)
            for m in res['matches']:
                m['json_path'] = path
                all_matches.append(m)
            return res['sanitized_text']
        elif isinstance(obj, dict):
            new_dict = {}
            for k, v in obj.items():
                new_dict[k] = recursive_sanitize(v, f"{path}.{k}" if path else k)
            return new_dict
        elif isinstance(obj, list):
            return [recursive_sanitize(item, f"{path}[{idx}]") for idx, item in enumerate(obj)]
        else:
            return obj

    sanitized_obj = recursive_sanitize(parsed)
    sanitized_json = json.dumps(sanitized_obj, indent=2)

    raw_hash = compute_sha256(json_text)
    san_hash = compute_sha256(sanitized_json)

    entity_counts = {}
    for m in all_matches:
        if m['id'] not in sanitizer.whitelisted_ids:
            entity_counts[m['type']] = entity_counts.get(m['type'], 0) + 1

    weighted_risk = sum(WEIGHT_MAP.get(k, 5) * min(v, 3) for k, v in entity_counts.items())
    risk_score = min(100, weighted_risk)
    risk_tier = 'Critical' if risk_score >= 80 else 'High' if risk_score >= 50 else 'Medium' if risk_score >= 20 else 'Low'

    compliance = []
    if 'Credit Card' in entity_counts:
        compliance.append('PCI-DSS')
    if any(k in entity_counts for k in ('Aadhaar', 'PAN', 'Phone', 'Email')):
        compliance.append('India DPDP Act')
    if any(k in entity_counts for k in ('Email', 'Phone', 'IPv4', 'Credit Card')):
        compliance.append('GDPR')

    return {
        'sanitized_text': sanitized_json,
        'matches': all_matches,
        'active_matches_count': sum(entity_counts.values()),
        'entity_counts': entity_counts,
        'rejected_traps_count': len(sanitizer.rejected_traps),
        'rejected_traps': sanitizer.rejected_traps,
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'compliance_frameworks': compliance,
        'raw_sha256': raw_hash,
        'sanitized_sha256': san_hash,
        'pseudonym_vault': sanitizer.pseudonym_map
    }

def process_xml(xml_text, options=None, pseudonym_map=None, counters=None):
    sanitizer = PIISanitizer(options, pseudonym_map, counters)
    root = ET.fromstring(xml_text)
    all_matches = []

    for elem in root.iter():
        if elem.text and elem.text.strip():
            res = sanitizer.sanitize(elem.text)
            elem.text = res['sanitized_text']
            all_matches.extend(res['matches'])
        if elem.tail and elem.tail.strip():
            res = sanitizer.sanitize(elem.tail)
            elem.tail = res['sanitized_text']
            all_matches.extend(res['matches'])
        for attr_k, attr_v in list(elem.attrib.items()):
            if attr_v and attr_v.strip():
                res = sanitizer.sanitize(attr_v)
                elem.attrib[attr_k] = res['sanitized_text']
                all_matches.extend(res['matches'])

    sanitized_xml = ET.tostring(root, encoding='utf-8').decode('utf-8')
    raw_hash = compute_sha256(xml_text)
    san_hash = compute_sha256(sanitized_xml)

    entity_counts = {}
    for m in all_matches:
        if m['id'] not in sanitizer.whitelisted_ids:
            entity_counts[m['type']] = entity_counts.get(m['type'], 0) + 1

    weighted_risk = sum(WEIGHT_MAP.get(k, 5) * min(v, 3) for k, v in entity_counts.items())
    risk_score = min(100, weighted_risk)
    risk_tier = 'Critical' if risk_score >= 80 else 'High' if risk_score >= 50 else 'Medium' if risk_score >= 20 else 'Low'

    compliance = []
    if 'Credit Card' in entity_counts:
        compliance.append('PCI-DSS')
    if any(k in entity_counts for k in ('Aadhaar', 'PAN', 'Phone', 'Email')):
        compliance.append('India DPDP Act')
    if any(k in entity_counts for k in ('Email', 'Phone', 'IPv4', 'Credit Card')):
        compliance.append('GDPR')

    return {
        'sanitized_text': sanitized_xml,
        'matches': all_matches,
        'active_matches_count': sum(entity_counts.values()),
        'entity_counts': entity_counts,
        'rejected_traps_count': len(sanitizer.rejected_traps),
        'rejected_traps': sanitizer.rejected_traps,
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'compliance_frameworks': compliance,
        'raw_sha256': raw_hash,
        'sanitized_sha256': san_hash,
        'pseudonym_vault': sanitizer.pseudonym_map
    }

def process_eml(eml_text, options=None, pseudonym_map=None, counters=None):
    sanitizer = PIISanitizer(options, pseudonym_map, counters)
    msg = email.message_from_string(eml_text, policy=policy.default)
    all_matches = []

    for header_name in ('From', 'To', 'Cc', 'Bcc', 'Reply-To', 'Subject'):
        val = msg[header_name]
        if val:
            res = sanitizer.sanitize(str(val))
            msg.replace_header(header_name, res['sanitized_text'])
            all_matches.extend(res['matches'])

    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                payload = part.get_payload()
                if payload:
                    res = sanitizer.sanitize(str(payload))
                    part.set_payload(res['sanitized_text'])
                    all_matches.extend(res['matches'])
    else:
        payload = msg.get_payload()
        if payload:
            res = sanitizer.sanitize(str(payload))
            msg.set_payload(res['sanitized_text'])
            all_matches.extend(res['matches'])

    sanitized_eml = msg.as_string()
    raw_hash = compute_sha256(eml_text)
    san_hash = compute_sha256(sanitized_eml)

    entity_counts = {}
    for m in all_matches:
        if m['id'] not in sanitizer.whitelisted_ids:
            entity_counts[m['type']] = entity_counts.get(m['type'], 0) + 1

    weighted_risk = sum(WEIGHT_MAP.get(k, 5) * min(v, 3) for k, v in entity_counts.items())
    risk_score = min(100, weighted_risk)
    risk_tier = 'Critical' if risk_score >= 80 else 'High' if risk_score >= 50 else 'Medium' if risk_score >= 20 else 'Low'

    compliance = []
    if 'Credit Card' in entity_counts:
        compliance.append('PCI-DSS')
    if any(k in entity_counts for k in ('Aadhaar', 'PAN', 'Phone', 'Email')):
        compliance.append('India DPDP Act')
    if any(k in entity_counts for k in ('Email', 'Phone', 'IPv4', 'Credit Card')):
        compliance.append('GDPR')

    return {
        'sanitized_text': sanitized_eml,
        'matches': all_matches,
        'active_matches_count': sum(entity_counts.values()),
        'entity_counts': entity_counts,
        'rejected_traps_count': len(sanitizer.rejected_traps),
        'rejected_traps': sanitizer.rejected_traps,
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'compliance_frameworks': compliance,
        'raw_sha256': raw_hash,
        'sanitized_sha256': san_hash,
        'pseudonym_vault': sanitizer.pseudonym_map
    }

def process_docx_base64(docx_base64_str, options=None, pseudonym_map=None, counters=None):
    sanitizer = PIISanitizer(options, pseudonym_map, counters)
    raw_bytes = base64.b64decode(docx_base64_str)
    in_zip = zipfile.ZipFile(io.BytesIO(raw_bytes), 'r')
    out_buf = io.BytesIO()
    out_zip = zipfile.ZipFile(out_buf, 'w', compression=zipfile.ZIP_DEFLATED)

    all_matches = []
    doc_xml_str = in_zip.read('word/document.xml').decode('utf-8')
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    ET.register_namespace('w', ns['w'])
    root = ET.fromstring(doc_xml_str)

    full_doc_lines = []

    for p in root.findall('.//w:p', ns):
        t_nodes = p.findall('.//w:t', ns)
        if not t_nodes:
            continue
        para_text = "".join(t.text or "" for t in t_nodes)
        if not para_text.strip():
            continue
        res = sanitizer.sanitize(para_text)
        all_matches.extend(res['matches'])
        san_para = res['sanitized_text']
        full_doc_lines.append(san_para)

        t_nodes[0].text = san_para
        for extra_t in t_nodes[1:]:
            extra_t.text = ""

    sanitized_doc_xml = ET.tostring(root, encoding='utf-8')

    for item in in_zip.infolist():
        if item.filename == 'word/document.xml':
            out_zip.writestr(item, sanitized_doc_xml)
        else:
            out_zip.writestr(item, in_zip.read(item.filename))

    out_zip.close()
    in_zip.close()

    sanitized_docx_b64 = base64.b64encode(out_buf.getvalue()).decode('utf-8')
    raw_hash = compute_sha256(raw_bytes)
    san_hash = compute_sha256(out_buf.getvalue())

    entity_counts = {}
    for m in all_matches:
        if m['id'] not in sanitizer.whitelisted_ids:
            entity_counts[m['type']] = entity_counts.get(m['type'], 0) + 1

    weighted_risk = sum(WEIGHT_MAP.get(k, 5) * min(v, 3) for k, v in entity_counts.items())
    risk_score = min(100, weighted_risk)
    risk_tier = 'Critical' if risk_score >= 80 else 'High' if risk_score >= 50 else 'Medium' if risk_score >= 20 else 'Low'

    compliance = []
    if 'Credit Card' in entity_counts:
        compliance.append('PCI-DSS')
    if any(k in entity_counts for k in ('Aadhaar', 'PAN', 'Phone', 'Email')):
        compliance.append('India DPDP Act')
    if any(k in entity_counts for k in ('Email', 'Phone', 'IPv4', 'Credit Card')):
        compliance.append('GDPR')

    return {
        'sanitized_text': "\n\n".join(full_doc_lines),
        'sanitized_docx_base64': sanitized_docx_b64,
        'matches': all_matches,
        'active_matches_count': sum(entity_counts.values()),
        'entity_counts': entity_counts,
        'rejected_traps_count': len(sanitizer.rejected_traps),
        'rejected_traps': sanitizer.rejected_traps,
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'compliance_frameworks': compliance,
        'raw_sha256': raw_hash,
        'sanitized_sha256': san_hash,
        'pseudonym_vault': sanitizer.pseudonym_map
    }

def process_cell_matrix(matrix, options=None, pseudonym_map=None, counters=None):
    sanitizer = PIISanitizer(options, pseudonym_map, counters)
    all_matches = []
    sanitized_matrix = []

    for r_idx, row in enumerate(matrix):
        new_row = []
        for c_idx, cell in enumerate(row):
            cell_str = str(cell) if cell is not None else ""
            res = sanitizer.sanitize(cell_str)
            new_row.append(res['sanitized_text'])
            for m in res['matches']:
                m['cell'] = f"R{r_idx+1}C{c_idx+1}"
                all_matches.append(m)
        sanitized_matrix.append(new_row)

    entity_counts = {}
    for m in all_matches:
        if m['id'] not in sanitizer.whitelisted_ids:
            entity_counts[m['type']] = entity_counts.get(m['type'], 0) + 1

    weighted_risk = sum(WEIGHT_MAP.get(k, 5) * min(v, 3) for k, v in entity_counts.items())
    risk_score = min(100, weighted_risk)
    risk_tier = 'Critical' if risk_score >= 80 else 'High' if risk_score >= 50 else 'Medium' if risk_score >= 20 else 'Low'

    compliance = []
    if 'Credit Card' in entity_counts:
        compliance.append('PCI-DSS')
    if any(k in entity_counts for k in ('Aadhaar', 'PAN', 'Phone', 'Email')):
        compliance.append('India DPDP Act')
    if any(k in entity_counts for k in ('Email', 'Phone', 'IPv4', 'Credit Card')):
        compliance.append('GDPR')

    return {
        'sanitized_matrix': sanitized_matrix,
        'matches': all_matches,
        'active_matches_count': sum(entity_counts.values()),
        'entity_counts': entity_counts,
        'rejected_traps_count': len(sanitizer.rejected_traps),
        'rejected_traps': sanitizer.rejected_traps,
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'compliance_frameworks': compliance,
        'pseudonym_vault': sanitizer.pseudonym_map
    }

def generate_verhoeff_aadhaar():
    prefix = "29471058362"
    cd = verhoeff_generate(prefix)
    return f"{prefix[:4]} {prefix[4:8]} {prefix[8:]}{cd}"

def generate_sample(sample_type):
    valid_aadhaar = generate_verhoeff_aadhaar()
    valid_card = "4539 1488 0343 6467"

    if sample_type == 'json':
        sample_dict = {
            "incident_id": "INC-2026-9812",
            "timestamp": "2026-11-27T10:45:00Z",
            "server_cluster": "aws-prod-mumbai-02",
            "reporter": {
                "name": "Vikram Malhotra",
                "email": "Vikram.Malhotra@CyberShield-Labs.in",
                "phone": "+91 98201 45982",
                "pan_number": "ABCPE1234F"
            },
            "customer_payload": {
                "account_number": "ACT-8841-9923-1104-5521",
                "beneficiary_aadhaar": valid_aadhaar,
                "billing_card": valid_card,
                "false_positive_card_trap": "8841-9923-1104-5521",
                "false_positive_aadhaar_trap": "2947 1058 3629",
                "ip_source": "103.21.244.18",
                "invalid_ip_version_trap": "v3.14.299.1"
            },
            "security_context": {
                "bearer_token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.s6zV9xQ9zL91K8w2P0qZ3vB7yN.eY38wR29Lm",
                "environment_version": "release-v2.18.4",
                "api_secret": "sec_prod_live_9f83a21bb09e4c8d7120384a9"
            }
        }
        return json.dumps(sample_dict, indent=2)

    elif sample_type == 'csv':
        lines = [
            '"Record_ID","Customer_Name","Contact_Email","Phone_Number","Govt_ID_PAN","Payment_Card","Order_Tracking_No","Client_IP"',
            f'"REC-001","Rajesh Verma","Rajesh.Verma@fintech.co.in","+91 98450 12345","ABCPE1234F","{valid_card}","8841-9923-1104-5521","49.207.180.22"',
            f'"REC-002","Pooja Sharma","pooja.sharma@healthcare.org","+91 98765 43210","XYZPH9988G","4000-0012-3456-7899","9912-4411-8822-3311","103.88.22.14"',
            f'"REC-003","Rajesh Verma","rajesh.verma@fintech.co.in","+91 98450 12345","ABCPE1234F","{valid_card}","1122-3344-5566-7788","49.207.180.22"',
            '"REC-004","System Daemon","service.account@infra.internal","+1-800-555-0199","NA","NA","TRK-v3.14.299.1","192.168.1.100"'
        ]
        return "\n".join(lines)

    else:
        doc = f"""================================================================================
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
Aadhaar Identity Proof: {valid_aadhaar}
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
Registered Card: {valid_card}
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
================================================================================
"""
        return doc
