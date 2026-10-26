const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
function load(file, mocks = {}, globals = {}) {
  const code = babel.transformSync(fs.readFileSync(path.resolve(__dirname, file), 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, require: n => mocks[n], ...globals });
  return exports;
}
const policy = load('../src/website/policy.js');
const google = load('../src/website/nativeGoogle.js', { './policy': policy });
const clientId = '1234567890-testclient.apps.googleusercontent.com';
const requestId = '12345678-1234-1234-1234-123456789012';
const fixture = () => {
  const calls = [];
  return { calls, sdk: {
    statusCodes: { SIGN_IN_CANCELLED: 'CANCELLED', PLAY_SERVICES_NOT_AVAILABLE: 'NO_PLAY' },
    GoogleSignin: {
      configure: options => calls.push(options),
      hasPlayServices: async () => true,
      signIn: async () => ({ type: 'success', data: { idToken: 'test-google-id-token' } }),
    },
  } };
};
test('native sign-in requests are restricted to AdWall login/register and correlated IDs', () => {
  const message = { type: 'google-signin', requestId };
  assert.equal(google.validGoogleRequest(message, 'https://www.adwallindia.com/login'), true);
  assert.equal(google.validGoogleRequest(message, 'https://adwallindia.com/register?google=1'), true);
  for (const url of ['https://evil.test/login', 'https://adwallindia.com.evil.test/login', 'https://adwallindia.com/chat/123', 'http://adwallindia.com/login']) assert.equal(google.validGoogleRequest(message, url), false);
  assert.equal(google.validGoogleRequest({ ...message, requestId: 'invalid' }, 'https://adwallindia.com/login'), false);
});
test('native account selection returns only the ID token and requests no offline scopes', async () => {
  const f = fixture();
  const signIn = google.createNativeGoogleSignIn({ loadSDK: () => f.sdk });
  const result = await signIn(clientId);
  assert.equal(result.credential, 'test-google-id-token');
  assert.equal(Object.keys(result).length, 1);
  assert.equal(f.calls[0].webClientId, clientId);
  assert.equal(f.calls[0].offlineAccess, false);
  await signIn(clientId);
  assert.equal(f.calls.length, 1);
});
test('cancelled picker releases the lock without showing a login error', async () => {
  const f = fixture();
  f.sdk.GoogleSignin.signIn = async () => ({ type: 'cancelled' });
  const signIn = google.createNativeGoogleSignIn({ loadSDK: () => f.sdk });
  assert.equal((await signIn(clientId)).cancelled, true);
  f.sdk.GoogleSignin.signIn = async () => { throw { code: 'CANCELLED' }; };
  assert.equal((await signIn(clientId)).cancelled, true);
});
test('duplicate taps do not launch a second account picker', async () => {
  const f = fixture();
  let complete;
  f.sdk.GoogleSignin.signIn = () => new Promise(resolve => complete = resolve);
  const signIn = google.createNativeGoogleSignIn({ loadSDK: () => f.sdk });
  const first = signIn(clientId);
  await Promise.resolve();
  assert.match((await signIn(clientId)).error, /pehle se/);
  complete({ type: 'cancelled' });
  await first;
});
test('missing IDs, missing native binary, Play Services and developer errors are visible and sanitized', async () => {
  const f = fixture();
  const signIn = google.createNativeGoogleSignIn({ loadSDK: () => f.sdk });
  assert.match((await signIn('placeholder')).error, /setup pending/);
  assert.equal(f.calls.length, 0);
  const noModule = google.createNativeGoogleSignIn({ loadSDK: () => { throw new Error('native module missing with internal details'); } });
  assert.match((await noModule(clientId)).error, /Naya APK/);
  f.sdk.GoogleSignin.signIn = async () => { throw { code: '10', message: 'private SDK dump' }; };
  assert.match((await signIn(clientId)).error, /SHA-1/);
  assert.equal((await signIn(clientId)).error.includes('private SDK dump'), false);
  f.sdk.GoogleSignin.hasPlayServices = async () => false;
  assert.match((await signIn(clientId)).error, /Play Services/);
});
test('late results are delivered only to an AdWall auth page', () => {
  const events = [];
  const script = google.googleResultScript(requestId, { credential: 'test-id-token' });
  const run = location => vm.runInNewContext(script, { location, window: { dispatchEvent: e => events.push(e) }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } } });
  run(new URL('https://evil.test/login'));
  run(new URL('https://adwallindia.com/client/dashboard'));
  assert.equal(events.length, 0);
  run(new URL('https://www.adwallindia.com/login'));
  assert.equal(events[0].detail.requestId, requestId);
  assert.equal(events[0].detail.credential, 'test-id-token');
});
function browserFixture() {
  const listeners = new Map(), sent = [];
  let timeout;
  const window = {
    __adwallNativeGoogle: 1,
    crypto: { randomUUID: () => requestId },
    ReactNativeWebView: { postMessage: value => sent.push(JSON.parse(value)) },
    addEventListener: (name, cb) => listeners.set(name, cb),
    removeEventListener: name => listeners.delete(name),
    setTimeout: cb => { timeout = cb; return 1; },
    clearTimeout: () => {},
  };
  const helper = load('../../adwall-frontend/src/lib/nativeGoogle.js', {}, { window });
  return { helper, window, listeners, sent, triggerTimeout: () => timeout() };
}
test('website forwards native credentials only to the pending request and cleans listeners', async () => {
  const f = browserFixture();
  const result = f.helper.requestNativeGoogle(clientId);
  assert.equal(f.sent[0].clientId, clientId);
  const callback = f.listeners.get('adwall:native-google-result');
  callback({ detail: { requestId: 'stale-request', credential: 'wrong' } });
  assert.equal(f.listeners.size, 1);
  callback({ detail: { requestId, credential: 'test-id-token' } });
  assert.equal(await result, 'test-id-token');
  assert.equal(f.listeners.size, 0);
});
test('website handles cancel, unmount abort and timeout without leaving a pending listener', async () => {
  const cancel = browserFixture();
  const cancelled = cancel.helper.requestNativeGoogle(clientId);
  cancel.listeners.get('adwall:native-google-result')({ detail: { requestId, cancelled: true } });
  assert.equal(await cancelled, null);
  const abort = browserFixture(), controller = new AbortController();
  const aborted = abort.helper.requestNativeGoogle(clientId, { signal: controller.signal });
  controller.abort();
  assert.equal(await aborted, null);
  assert.equal(abort.listeners.size, 0);
  const slow = browserFixture();
  const timedOut = slow.helper.requestNativeGoogle(clientId);
  const rejected = assert.rejects(timedOut, /time lag raha/);
  slow.triggerTimeout();
  await rejected;
  assert.equal(slow.listeners.size, 0);
});

test('native configuration keeps Android Firebase-free and adds iOS scheme only when configured', () => {
  const configure = require('../app.config.js');
  const savedWeb = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const savedIOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  try {
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const base = { plugins: ['expo-font'], extra: { apiUrl: 'https://example.test/api' } };
    assert.deepEqual(configure({ config: base }).plugins, ['expo-font']);
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = clientId;
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '1234567890-iosclient.apps.googleusercontent.com';
    const result = configure({ config: base });
    assert.equal(result.extra.googleWebClientId, clientId);
    assert.equal(result.extra.apiUrl, base.extra.apiUrl);
    assert.equal(result.plugins[1][1].iosUrlScheme, 'com.googleusercontent.apps.1234567890-iosclient');
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'not-a-client';
    assert.throws(() => configure({ config: base }), /Web OAuth client ID/);
  } finally {
    if (savedWeb === undefined) delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; else process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = savedWeb;
    if (savedIOS === undefined) delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; else process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = savedIOS;
  }
});

test('failed Google authentication stays visible without a refresh redirect', async () => {
  let onError, refreshes = 0;
  const api = Object.assign(async () => {}, { interceptors: { request: { use: () => {} }, response: { use: (_success, failure) => { onError = failure; } } } });
  const axios = { create: () => api, post: async () => { refreshes++; throw new Error('No session'); } };
  let source = fs.readFileSync(path.resolve(__dirname, '../../adwall-frontend/src/services/api.js'), 'utf8');
  source = source.replace(/import\.meta\.env\.VITE_API_URL/g, JSON.stringify('https://backend.example/api'));
  const code = babel.transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const window = { location: { href: '/register' } };
  vm.runInNewContext(code, { exports: {}, require: () => axios, window, localStorage: { getItem: () => null, removeItem: () => {} } });
  for (const url of ['/auth/google', '/auth/google/complete', '/auth/login', '/auth/register', '/auth/refresh']) {
    const error = { config: { url }, response: { status: 401, data: { message: 'Google authentication failed' } } };
    await assert.rejects(onError(error), received => received === error);
  }
  assert.equal(refreshes, 0);
  assert.equal(window.location.href, '/register');
});
