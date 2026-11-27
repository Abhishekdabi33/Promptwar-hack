import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public')))

from engine import (
    luhn_validate,
    luhn_generate,
    verhoeff_validate,
    verhoeff_generate,
    ipv4_validate,
    pan_validate,
    calculate_shannon_entropy,
    PIISanitizer,
    process_text,
    process_csv,
    process_json
)

class TestPIIShieldEngine(unittest.TestCase):

    def test_credit_card_luhn_validation(self):
        prefix = "453201511283036"
        check_digit = luhn_generate(prefix)
        valid_card = prefix + check_digit
        self.assertTrue(luhn_validate(valid_card))

        invalid_card = "8841-9923-1104-5521"
        self.assertFalse(luhn_validate(invalid_card))

        text = f"Payment card: {valid_card} and invoice serial {invalid_card}"
        sanitizer = PIISanitizer({'redaction_mode': 'full'})
        res = sanitizer.sanitize(text)

        self.assertIn("[REDACTED_CARD]", res['sanitized_text'])
        self.assertIn(invalid_card, res['sanitized_text'])
        self.assertGreaterEqual(res['rejected_traps_count'], 1)
        trap_values = [t['value'] for t in res['rejected_traps']]
        self.assertIn(invalid_card, trap_values)

    def test_aadhaar_verhoeff_validation(self):
        prefix = "29471058362"
        check_digit = verhoeff_generate(prefix)
        valid_aadhaar = prefix + check_digit
        self.assertTrue(verhoeff_validate(valid_aadhaar))

        invalid_aadhaar = "29471058362" + str((int(check_digit) + 1) % 10)
        self.assertFalse(verhoeff_validate(invalid_aadhaar))

        text = f"Aadhaar id is {valid_aadhaar} and order ID is {invalid_aadhaar}"
        sanitizer = PIISanitizer({'redaction_mode': 'full'})
        res = sanitizer.sanitize(text)

        self.assertIn("[REDACTED_AADHAAR]", res['sanitized_text'])
        self.assertIn(invalid_aadhaar, res['sanitized_text'])
        self.assertGreaterEqual(res['rejected_traps_count'], 1)
        trap_values = [t['value'] for t in res['rejected_traps']]
        self.assertIn(invalid_aadhaar, trap_values)

    def test_ipv4_validation(self):
        self.assertTrue(ipv4_validate("192.168.1.1"))
        self.assertTrue(ipv4_validate("10.0.0.254"))
        self.assertFalse(ipv4_validate("3.14.299.1"))
        self.assertFalse(ipv4_validate("192.168.1"))
        self.assertFalse(ipv4_validate("999.999.999.999"))

        text = "Server IP is 192.168.1.1 but release tag is v3.14.299.1"
        sanitizer = PIISanitizer({'redaction_mode': 'full'})
        res = sanitizer.sanitize(text)

        self.assertIn("[REDACTED_IPV4]", res['sanitized_text'])
        self.assertIn("v3.14.299.1", res['sanitized_text'])
        self.assertEqual(len([m for m in res['matches'] if m['type'] == 'IPv4']), 1)

    def test_indian_pan_validation(self):
        valid_pan = "ABCPE1234F"
        self.assertTrue(pan_validate(valid_pan))

        invalid_pan_char = "ABCXE1234F"
        self.assertFalse(pan_validate(invalid_pan_char))

        text = f"Individual PAN: {valid_pan}, Invalid PAN: {invalid_pan_char}"
        sanitizer = PIISanitizer({'redaction_mode': 'full'})
        res = sanitizer.sanitize(text)

        self.assertIn("[REDACTED_PAN]", res['sanitized_text'])
        self.assertIn(invalid_pan_char, res['sanitized_text'])

    def test_overlap_priority_resolution(self):
        prefix = "453201511283036"
        valid_card = prefix + luhn_generate(prefix)
        text = f"Card number: {valid_card}"

        sanitizer = PIISanitizer({'redaction_mode': 'full'})
        res = sanitizer.sanitize(text)

        self.assertEqual(res['active_matches_count'], 1)
        self.assertEqual(res['matches'][0]['type'], 'Credit Card')
        self.assertEqual(res['sanitized_text'], "Card number: [REDACTED_CARD]")

    def test_all_three_redaction_modes_and_email_normalization(self):
        email_1 = "john.doe@example.com"
        email_2 = "JOHN.DOE@EXAMPLE.COM"
        text = f"Primary: {email_1}, Secondary: {email_2}"

        res_full = process_text(text, {'redaction_mode': 'full'})
        self.assertEqual(res_full['sanitized_text'], "Primary: [REDACTED_EMAIL], Secondary: [REDACTED_EMAIL]")

        res_partial = process_text(text, {'redaction_mode': 'partial'})
        self.assertIn("j***@example.com", res_partial['sanitized_text'])
        self.assertIn("J***@EXAMPLE.COM", res_partial['sanitized_text'])

        shared_map = {}
        shared_counters = {}
        res_pseudo = process_text(text, {'redaction_mode': 'pseudonym'}, shared_map, shared_counters)

        self.assertEqual(res_pseudo['sanitized_text'], "Primary: EMAIL_01, Secondary: EMAIL_01")
        self.assertEqual(len(shared_map), 1)

    def test_csv_structure_preservation_and_shared_pseudonyms(self):
        csv_input = 'Name,Contact,Email\n"Doe, John",+91-9876543210,john@example.com\n"Smith, Jane",+91-9876543210,jane@example.com'
        shared_map = {}
        shared_counters = {}

        res = process_csv(csv_input, {'redaction_mode': 'pseudonym'}, shared_map, shared_counters)
        sanitized_csv = res['sanitized_text']

        self.assertIn('"Doe, John"', sanitized_csv)
        self.assertIn('"Smith, Jane"', sanitized_csv)
        self.assertIn('PHONE_01', sanitized_csv)
        self.assertIn('EMAIL_01', sanitized_csv)
        self.assertIn('EMAIL_02', sanitized_csv)

        lines = sanitized_csv.strip().splitlines()
        self.assertEqual(len(lines), 3)

    def test_message_safety_guard_detection(self):
        risky_message = "Your OTP is 894102 and password is SecretPass99! Pay to me@okaxis via IFSC HDFC0001234 or click http://bit.ly/login"
        sanitizer = PIISanitizer({'redaction_mode': 'full'})
        res = sanitizer.sanitize(risky_message)

        detected_types = {m['type'] for m in res['matches']}
        self.assertIn('OTP', detected_types)
        self.assertIn('Password', detected_types)
        self.assertIn('Financial', detected_types)
        self.assertIn('Suspicious Link', detected_types)
        self.assertIn(res['risk_tier'], ('High', 'Critical'))

        clean_message = "Hello, looking forward to meeting you tomorrow at 10 AM in conference room B."
        res_clean = sanitizer.sanitize(clean_message)
        self.assertEqual(res_clean['active_matches_count'], 0)
        self.assertEqual(res_clean['risk_tier'], 'Low')

    def test_invalid_custom_regex_safety(self):
        broken_rule = {
            'id': 'broken_1',
            'type': 'regex',
            'value': '[a-z('
        }
        text = "Sample string with normal text 123"
        sanitizer = PIISanitizer({
            'redaction_mode': 'full',
            'custom_rules': [broken_rule]
        })

        try:
            res = sanitizer.sanitize(text)
            self.assertEqual(res['sanitized_text'], text)
        except Exception as e:
            self.fail(f"Engine crashed on invalid custom regex: {e}")

if __name__ == '__main__':
    unittest.main()
