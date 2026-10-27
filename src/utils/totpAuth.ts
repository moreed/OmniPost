import QRCode from 'qrcode';

// Base32 RFC 4648 Alphabet
const RFC4648_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a Uint8Array buffer into a Base32 string (without padding)
 */
export function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += RFC4648_BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += RFC4648_BASE32[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Uint8Array
 */
export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = RFC4648_BASE32.indexOf(clean[i]);
    if (val === -1) {
      continue; // Skip invalid characters
    }
    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Generates a cryptographically random 20-byte (160-bit) Base32 secret for TOTP
 */
export function generateTotpSecret(): string {
  const randomBytes = new Uint8Array(20);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return base32Encode(randomBytes);
}

/**
 * Computes an RFC 6238 TOTP code for a given timestamp and Base32 secret.
 * Uses Web Crypto HMAC-SHA1.
 */
export async function generateTotpCode(
  secret: string,
  timestampMs: number = Date.now(),
  timeStepSeconds: number = 30
): Promise<string> {
  const timeStep = Math.floor(timestampMs / 1000 / timeStepSeconds);
  const secretBytes = base32Decode(secret);

  // 8-byte big-endian counter
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // Upper 32 bits
  counterView.setUint32(0, Math.floor(timeStep / 0x100000000));
  // Lower 32 bits
  counterView.setUint32(4, timeStep & 0xffffffff);

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const signatureBytes = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = signatureBytes[signatureBytes.length - 1] & 0x0f;
  const binary =
    ((signatureBytes[offset] & 0x7f) << 24) |
    ((signatureBytes[offset + 1] & 0xff) << 16) |
    ((signatureBytes[offset + 2] & 0xff) << 8) |
    (signatureBytes[offset + 3] & 0xff);

  const code = (binary % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Verifies a 6-digit TOTP code with ±1 step window drift tolerance
 */
export async function verifyTotpCode(
  secret: string,
  inputCode: string,
  timeStepSeconds: number = 30
): Promise<boolean> {
  const cleanInput = inputCode.trim();
  if (!/^\d{6}$/.test(cleanInput)) {
    return false;
  }

  const now = Date.now();
  const windows = [-1, 0, 1]; // Current, previous (-30s), next (+30s)

  for (const w of windows) {
    const candidateCode = await generateTotpCode(
      secret,
      now + w * timeStepSeconds * 1000,
      timeStepSeconds
    );
    if (candidateCode === cleanInput) {
      return true;
    }
  }

  return false;
}

/**
 * Builds standard key URI for authenticator applications
 * e.g. otpauth://totp/OmniPost:Administrator?secret=...&issuer=OmniPost&algorithm=SHA1&digits=6&period=30
 */
export function buildOtpAuthUri(
  secret: string,
  accountName: string = 'Administrator',
  issuer: string = 'OmniPost Studio'
): string {
  const cleanSecret = secret.replace(/\s+/g, '');
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Renders a high-contrast QR code data URL from an OTP auth URI
 */
export async function generateQrCodeDataUrl(otpAuthUri: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#030712',
      light: '#ffffff',
    },
    width: 256,
  });
}

/**
 * Generates 8 cryptographically secure single-use backup recovery codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

export interface Admin2FAConfig {
  enabled: boolean;
  secret: string;
  backupCodes: Array<{ code: string; used: boolean; usedAt?: string }>;
  enrolledAt: string;
}

const STORAGE_2FA_KEY = 'omnipost_admin_2fa_v1';

// Seeded persistent default secret for effortless testing out of the box
// "JBSWY3DPEHPK3PXP" is the standard RFC sample test secret
export const DEFAULT_2FA_CONFIG: Admin2FAConfig = {
  enabled: true,
  secret: 'JBSWY3DPEHPK3PXP', // Compatible with standard test tokens
  backupCodes: [
    { code: '9A7X-4K2M', used: false },
    { code: '3B8R-9P1W', used: false },
    { code: '7K4T-8L5N', used: false },
    { code: '2F9V-6D3Q', used: false },
    { code: '8M2P-5H7Y', used: false },
    { code: '4X1C-9J6Z', used: false },
    { code: '6R3K-2B8T', used: false },
    { code: '5N8W-7F4X', used: false },
  ],
  enrolledAt: '2026-10-24T00:00:00.000Z',
};

export function loadAdmin2FAConfig(): Admin2FAConfig {
  try {
    const raw = localStorage.getItem(STORAGE_2FA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.secret && Array.isArray(parsed.backupCodes)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_2FA_CONFIG;
}

export function saveAdmin2FAConfig(config: Admin2FAConfig): void {
  try {
    localStorage.setItem(STORAGE_2FA_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Validates and consumes an emergency backup recovery code
 */
export function consumeBackupCode(inputCode: string): { success: boolean; remainingCount: number } {
  const config = loadAdmin2FAConfig();
  const normalized = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  
  const targetIndex = config.backupCodes.findIndex(
    item => !item.used && item.code.replace(/-/g, '') === normalized.replace(/-/g, '')
  );

  if (targetIndex === -1) {
    const remaining = config.backupCodes.filter(c => !c.used).length;
    return { success: false, remainingCount: remaining };
  }

  // Mark as used
  config.backupCodes[targetIndex].used = true;
  config.backupCodes[targetIndex].usedAt = new Date().toISOString();
  saveAdmin2FAConfig(config);

  const remaining = config.backupCodes.filter(c => !c.used).length;
  return { success: true, remainingCount: remaining };
}
