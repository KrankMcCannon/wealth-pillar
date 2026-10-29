/* eslint-disable */
const dns = require('node:dns');

// Monkey-patch standard callback dns.lookup
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (hostname === 'localhost') {
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : options;
    return originalLookup('127.0.0.1', opts, cb);
  }
  return originalLookup(hostname, options, callback);
};

// Monkey-patch promise-based dns.promises.lookup
try {
  const dnsPromises = require('node:dns/promises');
  const originalPromisesLookup = dnsPromises.lookup;
  dnsPromises.lookup = function (hostname, options) {
    if (hostname === 'localhost') {
      return originalPromisesLookup('127.0.0.1', options);
    }
    return originalPromisesLookup(hostname, options);
  };
} catch (e) {}

// Also patch dns.promises lookup accessed via dns.promises property
try {
  if (dns.promises && dns.promises.lookup) {
    const originalDnsPromisesLookup = dns.promises.lookup;
    dns.promises.lookup = function (hostname, options) {
      if (hostname === 'localhost') {
        return originalDnsPromisesLookup('127.0.0.1', options);
      }
      return originalDnsPromisesLookup(hostname, options);
    };
  }
} catch (e) {}
