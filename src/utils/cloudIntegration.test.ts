import test from 'node:test';
import assert from 'node:assert';
import { 
  DEFAULT_R2_CONFIG, 
  loadR2Config, 
  testR2Connection, 
  uploadMediaToR2, 
  loadR2Assets 
} from '../services/cloudflareR2';

test('Cloudflare R2 default configuration is valid', () => {
  const cfg = loadR2Config();
  assert.ok(cfg.accountId.length > 10, 'Account ID should be present');
  assert.ok(cfg.bucketName.includes('media') || cfg.bucketName.includes('omnipost'), 'Bucket name should be valid');
  assert.ok(cfg.publicDomain.startsWith('http'), 'Public CDN domain should be http/https');
});

test('Cloudflare R2 handshake verification test succeeds with valid settings', async () => {
  const res = await testR2Connection(DEFAULT_R2_CONFIG);
  assert.strictEqual(res.success, true);
  assert.ok(res.latencyMs >= 0);
  assert.ok(res.message.includes('OK') || res.message.includes('ready'));
  assert.ok(res.details.endpoint.includes('.r2.cloudflarestorage.com'));
});

test('Cloudflare R2 handshake rejects missing Account ID', async () => {
  const res = await testR2Connection({
    ...DEFAULT_R2_CONFIG,
    accountId: '',
  });
  assert.strictEqual(res.success, false);
  assert.ok(res.message.toLowerCase().includes('account id'));
});

test('Cloudflare R2 handshake rejects missing Access Key ID or Secret', async () => {
  const resNoAccessKey = await testR2Connection({
    ...DEFAULT_R2_CONFIG,
    accessKeyId: '',
  });
  assert.strictEqual(resNoAccessKey.success, false);
  assert.ok(resNoAccessKey.message.includes('Access Key ID'));

  const resNoSecret = await testR2Connection({
    ...DEFAULT_R2_CONFIG,
    secretAccessKey: '',
  });
  assert.strictEqual(resNoSecret.success, false);
  assert.ok(resNoSecret.message.includes('Secret Access Key'));
});

test('Cloudflare R2 handshake rejects missing Bucket Name', async () => {
  const res = await testR2Connection({
    ...DEFAULT_R2_CONFIG,
    bucketName: '',
  });
  assert.strictEqual(res.success, false);
  assert.ok(res.message.toLowerCase().includes('bucket name'));
});

test('Cloudflare R2 upload generates persistent public CDN URL', async () => {
  const fakeBlob = new Blob(['sample-video-bytes'], { type: 'video/webm' });
  const uploadRes = await uploadMediaToR2({
    fileBlob: fakeBlob,
    fileName: 'test_render.webm',
    contentType: 'video/webm',
    mediaType: 'video',
    postTitle: 'Day 1 Sound Healing',
  });

  assert.ok(uploadRes.url.startsWith(DEFAULT_R2_CONFIG.publicDomain));
  assert.ok(uploadRes.key.includes('videos/'));
  assert.strictEqual(uploadRes.sizeBytes, fakeBlob.size);

  const assets = loadR2Assets();
  const found = assets.find(a => a.key === uploadRes.key);
  assert.ok(found, 'Asset must be cached in R2 assets vault');
});
