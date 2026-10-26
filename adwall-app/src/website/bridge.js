import { WEBSITE_HOSTS, MAX_DOWNLOAD_BYTES } from "./policy";

// No tokens, cookies or form fields are copied across the native bridge.
// React Router, forms, uploads and checkout continue to run in the live site.
export const WEBSITE_BRIDGE = `
(function () {
  if (window.top !== window || location.protocol !== 'https:' ||
      ${JSON.stringify(WEBSITE_HOSTS)}.indexOf(location.hostname) < 0 || window.__adwallBridgeReady) return;
  window.__adwallBridgeReady = true;
  var send = function (message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  };
  var blobs = new Map();
  var createObjectURL = URL.createObjectURL.bind(URL);
  var revokeObjectURL = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = function (blob) {
    var url = createObjectURL(blob);
    blobs.set(url, blob);
    return url;
  };
  URL.revokeObjectURL = function (url) {
    blobs.delete(url);
    return revokeObjectURL(url);
  };
  var exportFile = function (href, name) {
    var data = blobs.has(href) ? Promise.resolve(blobs.get(href)) : fetch(href).then(function (response) { return response.blob(); });
    data.then(function (blob) {
      if (blob.size > ${MAX_DOWNLOAD_BYTES}) throw new Error('File is too large. Download it from the browser.');
      var reader = new FileReader();
      reader.onload = function () { send({type:'download', name:name, data:reader.result}); };
      reader.onerror = function () { send({type:'download-error'}); };
      reader.readAsDataURL(blob);
    }).catch(function () { send({type:'download-error'}); });
  };
  var anchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    // Reports creates a detached anchor and revokes its Blob URL immediately.
    if (/^(blob:|data:)/i.test(this.href) && this.hasAttribute('download')) {
      exportFile(this.href, this.download || 'adwall-download');
      return;
    }
    return anchorClick.call(this);
  };
  document.addEventListener('click', function (event) {
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor) return;
    var href = anchor.href;
    if (/^(blob:|data:)/i.test(href) && anchor.hasAttribute('download')) {
      event.preventDefault();
      exportFile(href, anchor.download || 'adwall-download');
    }
  }, true);
  // The website opens booking chat and agreements in a new window. Route the
  // chat into the same WebView (same session); send document links to the OS.
  var originalOpen = window.open;
  window.open = function (url, target, features) {
    if (!url) return originalOpen.call(window, url, target, features);
    try {
      var resolved = new URL(url, location.href);
      if (resolved.protocol === 'https:' && ${JSON.stringify(WEBSITE_HOSTS)}.indexOf(resolved.hostname) >= 0) {
        send({type:'open', url:resolved.href});
        return null;
      }
      return originalOpen.call(window, url, target, features);
    } catch (_) { return null; }
  };
})();
true;
`;

// This small bootstrap runs both before content and at document load. The event
// covers React mounting before Android finishes its early script injection.
export const NATIVE_GOOGLE_BOOTSTRAP = `
(function () {
  if (window.top !== window || location.protocol !== 'https:' ||
      ${JSON.stringify(WEBSITE_HOSTS)}.indexOf(location.hostname) < 0) return;
  window.__adwallNativeGoogle = 1;
  window.dispatchEvent(new Event('adwall:native-ready'));
})();
true;
`;
