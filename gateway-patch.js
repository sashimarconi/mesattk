(function () {
  const originalFetch = window.fetch.bind(window);

  async function resolveBody(input, init) {
    if (init && Object.prototype.hasOwnProperty.call(init, 'body')) {
      return init.body;
    }

    if (input instanceof Request) {
      return input.clone().text();
    }

    return undefined;
  }

  function getUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    if (input instanceof Request) return input.url;
    return String(input || '');
  }

  window.fetch = async function patchedFetch(input, init) {
    const url = getUrl(input);

    try {
      if (url.includes('/functions/v1/create-pix-payment')) {
        const body = await resolveBody(input, init);
        return originalFetch('/api/create-pix-payment', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
      }

      if (url.includes('/functions/v1/check-pix-status')) {
        const body = await resolveBody(input, init);
        return originalFetch('/api/check-pix-status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
      }
    } catch (error) {
      console.error('Gateway patch error:', error);
    }

    return originalFetch(input, init);
  };
})();
