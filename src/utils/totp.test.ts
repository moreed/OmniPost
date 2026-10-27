import { test } from 'node:test';
import assert from 'node:assert';
import {
  base32Encode,
  base32Decode,
  generateTotpCode,
  verifyTotpCode,
  buildOtpAuthUri,
  generateBackupCodes,
  consumeBackupCode,
  loadAdmin2FAConfig,
  saveAdmin2FAConfig
} from './totpAuth.ts';

test('Base32 encoding and decoding round-trip', () => {
  const original = new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
  const encoded = base32Encode(original);
  assert.ok(encoded.length > 0);
  const decoded = base32Decode(encoded);
  assert.deepStrictEqual(Array.from(decoded), Array.from(original));
});

test('TOTP generates 6-digit numeric string', async () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const code = await generateTotpCode(secret, 1700000000000);
  assert.strictEqual(typeof code, 'string');
  assert.strictEqual(code.length, 6);
  assert.match(code, /^\d{6}$/);
});

test('TOTP verification succeeds within active time window', async () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const now = Date.now();
  const currentCode = await generateTotpCode(secret, now);
  const isValid = await verifyTotpCode(secret, currentCode);
  assert.strictEqual(isValid, true);
});

test('TOTP verification fails with incorrect code', async () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const isInvalid = await verifyTotpCode(secret, '000000');
  // It should be false unless 000000 happens to be the exact code
  const currentCode = await generateTotpCode(secret, Date.now());
  if (currentCode !== '000000') {
    assert.strictEqual(isInvalid, false);
  }
});

test('OTP auth URI format', () => {
  const uri = buildOtpAuthUri('JBSWY3DPEHPK3PXP', 'Administrator', 'OmniPost');
  assert.ok(uri.startsWith('otpauth://totp/OmniPost:Administrator?secret=JBSWY3DPEHPK3PXP'));
  assert.ok(uri.includes('issuer=OmniPost'));
  assert.ok(uri.includes('period=30'));
});

test('Backup code generation and consumption', () => {
  const backupCodes = generateBackupCodes(4);
  assert.strictEqual(backupCodes.length, 4);
  assert.match(backupCodes[0], /^[2-9A-Z]{4}-[2-9A-Z]{4}$/);

  // Setup fake storage for node environment
  (globalThis as any).localStorage = {
    data: {} as Record<string, string>,
    getItem(k: string) { return this.data[k] || null; },
    setItem(k: string, v: string) { this.data[k] = v; },
  };

  saveAdmin2FAConfig({
    enabled: true,
    secret: 'JBSWY3DPEHPK3PXP',
    backupCodes: [
      { code: '9A7X-4K2M', used: false },
      { code: '3B8R-9P1W', used: false },
    ],
    enrolledAt: new Date().toISOString(),
  });

  const res1 = consumeBackupCode('9A7X-4K2M');
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.remainingCount, 1);

  // Second attempt with same code must fail
  const res2 = consumeBackupCode('9A7X-4K2M');
  assert.strictEqual(res2.success, false);
  assert.strictEqual(res2.remainingCount, 1);

  // Second valid code succeeds
  const res3 = consumeBackupCode('3B8R9P1W'); // test hyphen-less entry
  assert.strictEqual(res3.success, true);
  assert.strictEqual(res3.remainingCount, 0);
});
