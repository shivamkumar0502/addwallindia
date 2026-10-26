const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
function loadModule(file, mocks = {}) {
  const filename = path.resolve(__dirname, '../src/website', file);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, require: (name) => mocks[name] }, { filename });
  return exports;
}
const policy = loadModule('policy.js');
const { WEBSITE_BRIDGE } = loadModule('bridge.js', { './policy': policy });
test('only actual HTTPS website origins can use the file bridge', () => {
  for (const url of ['https://www.adwallindia.com/search', 'https://adwallindia.com/client/bookings/123']) assert.equal(policy.isWebsiteUrl(url), true);
  for (const url of ['https://adwallindia.com.evil.test', 'https://evil.test/?site=adwallindia.com', 'https://adwallindia.com@evil.test', 'https://user:secret@adwallindia.com', 'http://adwallindia.com', 'https://adwallindia.com:444', 'javascript:alert(1)', undefined]) assert.equal(policy.isWebsiteUrl(url), false);
});
test('checkout HTTPS redirects stay embedded and app links are explicit', () => {
  for (const url of ['https://api.razorpay.com/v1/checkout', 'https://bank.example/3ds', 'https://adwallindia.com/search', 'about:blank']) assert.equal(policy.classifyNavigation(url), 'embedded');
  for (const url of ['upi://pay?pa=merchant', 'tel:+911234567890', 'mailto:support@example.com', 'whatsapp://send?text=Hello']) assert.equal(policy.classifyNavigation(url), 'external');
  assert.equal(policy.classifyNavigation('https://accounts.google.com/o/oauth2/auth'), 'google');
  for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'http://adwallindia.com', 'intent://untrusted', 'not-a-url']) assert.equal(policy.classifyNavigation(url), 'blocked');
});
test('document export validates size, encoding, MIME and safe filename', () => {
  const parsed = policy.parseDownload({ type: 'download', name: '../../reports.csv', data: 'data:text/csv;base64,YSxiCg==' });
  assert.equal(parsed.name, 'reports.csv');
  assert.equal(Buffer.from(parsed.base64, 'base64').toString(), 'a,b\n');
  for (const data of ['data:text/html;base64,PHNjcmlwdD4=', 'data:text/csv;base64,????', 'data:text/csv,abc', 'data:text/csv;base64,YQ=', 'data:text/csv;base64,' + 'A'.repeat(Math.ceil(policy.MAX_DOWNLOAD_BYTES / 3) * 4 + 4)]) assert.equal(policy.parseDownload({ type: 'download', data }), null);
});
function browserFixture(hostname = 'www.adwallindia.com') {
  const messages = [], navigation = [], blobs = new Map(), listeners = {};
  let seq = 0;
  class Anchor {
    constructor() { this.href = ''; this.download = ''; this.attributes = new Set(); }
    hasAttribute(name) { return this.attributes.has(name); }
    click() { this.defaultClick = true; }
  }
  class Reader {
    readAsDataURL(blob) {
      blob.arrayBuffer().then(buffer => {
        this.result = 'data:' + (blob.type || 'application/octet-stream') + ';base64,' + Buffer.from(buffer).toString('base64');
        this.onload();
      });
    }
  }
  class BrowserURL extends URL {}
  BrowserURL.createObjectURL = blob => { const u = 'blob:https://' + hostname + '/' + (++seq); blobs.set(u, blob); return u; };
  BrowserURL.revokeObjectURL = u => blobs.delete(u);
  const window = { ReactNativeWebView: { postMessage: message => messages.push(JSON.parse(message)) }, open: (...args) => navigation.push(args) };
  window.top = window;
  const context = { window, location: { protocol: 'https:', hostname, href: 'https://' + hostname + '/admin/reports' }, URL: BrowserURL, HTMLAnchorElement: Anchor, FileReader: Reader, document: { addEventListener: (type, cb) => listeners[type] = cb }, fetch: async href => { if (!blobs.has(href)) throw new Error('Revoked'); return { blob: async () => blobs.get(href) }; }, Map, Promise };
  vm.runInNewContext(WEBSITE_BRIDGE, context);
  return { ...context, messages, navigation, listeners };
}
test('detached report download survives immediate Blob URL revocation', async () => {
  const fixture = browserFixture();
  const anchor = new fixture.HTMLAnchorElement();
  anchor.href = fixture.URL.createObjectURL(new Blob(['city,total\nDelhi,12'], { type: 'text/csv' }));
  anchor.download = 'report.csv';
  anchor.attributes.add('download');
  anchor.click();
  fixture.URL.revokeObjectURL(anchor.href);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.messages.length, 1);
  assert.equal(fixture.messages[0].name, 'report.csv');
  assert.equal(Buffer.from(policy.parseDownload(fixture.messages[0]).base64, 'base64').toString(), 'city,total\nDelhi,12');
  assert.equal(anchor.defaultClick, undefined);
});
test('same-site chat popup stays in app while payment popups keep original behavior', () => {
  const fixture = browserFixture();
  fixture.window.open('/chat/booking-123', '_blank');
  assert.equal(fixture.messages[0].url, 'https://www.adwallindia.com/chat/booking-123');
  fixture.window.open('https://bank.example/challenge', '_blank');
  assert.equal(fixture.navigation[0][0], 'https://bank.example/challenge');
});
test('bridge is not installed on payment or unrelated origins', () => {
  const fixture = browserFixture('api.razorpay.com');
  assert.equal(fixture.window.__adwallBridgeReady, undefined);
  assert.equal(Object.keys(fixture.listeners).length, 0);
});

test('Android payment intents extract only a known payment scheme', () => {
  const intent = 'intent://pay?pa=merchant@example#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end';
  assert.equal(policy.classifyNavigation(intent), 'external');
  assert.equal(policy.paymentIntentUrl(intent), 'upi://pay?pa=merchant@example');
  assert.equal(policy.classifyNavigation('intent://settings#Intent;scheme=android;end'), 'blocked');
  assert.equal(policy.paymentIntentUrl('intent://pay#Intent;scheme=evil;S.browser_fallback_url=https://evil.test;end'), null);
});
