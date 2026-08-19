(function () {
  'use strict';

  // Prevent multiple initializations on the same page
  if (window.__NomadsChatWidgetLoaded) return;
  window.__NomadsChatWidgetLoaded = true;

  // 1. Locate current script tag and extract parameters
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].getAttribute('data-bot-id') || (scripts[i].src && scripts[i].src.indexOf('/widget.js') !== -1)) {
        return scripts[i];
      }
    }
    return null;
  })();

  var botId = (currentScript && currentScript.getAttribute('data-bot-id')) || window.NomadsChatBotId;
  if (!botId) {
    console.warn('[NomadsChat] Chatbot script missing data-bot-id attribute.');
    return;
  }

  // Derive Server Origin from script src or fallback to current origin
  var apiOrigin = '';
  if (currentScript && currentScript.src) {
    try {
      var scriptUrl = new URL(currentScript.src, window.location.href);
      apiOrigin = scriptUrl.origin;
    } catch (e) {
      apiOrigin = window.location.origin;
    }
  } else {
    apiOrigin = window.location.origin;
  }

  // 2. Automatically Detect Host Website Context
  var hostOrigin = window.location.origin;
  var hostUrl = window.location.href;
  var hostTitle = document.title || '';

  // Extract initial text snapshot from the active DOM for SPA/React/Next.js/Shopify immediate grounding
  function extractPageTextSnapshot() {
    try {
      // Clone main or body content to strip scripts and invisible elements
      var container = document.querySelector('main') || document.querySelector('article') || document.body;
      if (!container) return '';

      var clone = container.cloneNode(true);
      var unwanted = clone.querySelectorAll('script, style, noscript, svg, nav, footer, header, [aria-hidden="true"]');
      for (var j = 0; j < unwanted.length; j++) {
        unwanted[j].parentNode && unwanted[j].parentNode.removeChild(unwanted[j]);
      }

      var text = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
      var metaDesc = document.querySelector('meta[name="description"]');
      var descContent = metaDesc ? metaDesc.getAttribute('content') || '' : '';

      var snapshot = (descContent ? 'Meta Description: ' + descContent + '\n\n' : '') + text;
      return snapshot.slice(0, 30000);
    } catch (err) {
      return '';
    }
  }

  // 3. Send Automatic Host Detection & Ingestion Handshake to Backend
  function syncHostWebsiteKnowledge() {
    var snapshot = extractPageTextSnapshot();
    var payload = {
      hostOrigin: hostOrigin,
      hostUrl: hostUrl,
      hostTitle: hostTitle,
      clientDomSnapshot: snapshot,
    };

    try {
      fetch(apiOrigin + '/api/chatbots/' + encodeURIComponent(botId) + '/auto-detect-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.success) {
            console.log('[NomadsChat] Host website dynamic knowledge synchronized: ' + hostOrigin + ' (' + (data.status || 'indexed') + ')');
          }
        })
        .catch(function (err) {
          console.log('[NomadsChat] Auto-sync notice:', err.message);
        });
    } catch (e) {
      // Non-blocking
    }
  }

  // Run auto-detection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncHostWebsiteKnowledge);
  } else {
    syncHostWebsiteKnowledge();
  }

  // 4. Inject Floating Chat Widget UI
  var isOpen = false;

  // Container styling
  var style = document.createElement('style');
  style.id = 'nomadschat-widget-styles';
  style.textContent = [
    '#nomadschat-root { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',
    '#nomadschat-bubble { width: 56px; height: 56px; border-radius: 50%; background: #09090b; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease; border: 1px solid rgba(255,255,255,0.15); user-select: none; }',
    '#nomadschat-bubble:hover { transform: scale(1.08); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); }',
    '#nomadschat-bubble:active { transform: scale(0.95); }',
    '#nomadschat-bubble svg { width: 26px; height: 26px; fill: currentColor; }',
    '#nomadschat-iframe-container { position: fixed; bottom: 92px; right: 24px; width: 400px; height: 600px; max-width: calc(100vw - 32px); max-height: calc(100vh - 110px); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.08); opacity: 0; transform: translateY(20px) scale(0.96); transform-origin: bottom right; pointer-events: none; transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); z-index: 2147483647; background: #ffffff; }',
    '#nomadschat-iframe-container.active { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }',
    '#nomadschat-iframe { width: 100%; height: 100%; border: none; }',
    '@media (max-width: 480px) { #nomadschat-iframe-container { bottom: 0; right: 0; width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; border-radius: 0; } }'
  ].join('\n');
  document.head.appendChild(style);

  // Widget DOM elements
  var root = document.createElement('div');
  root.id = 'nomadschat-root';

  var bubble = document.createElement('div');
  bubble.id = 'nomadschat-bubble';
  bubble.setAttribute('aria-label', 'Open AI Support Assistant');
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>';

  var iframeContainer = document.createElement('div');
  iframeContainer.id = 'nomadschat-iframe-container';

  var iframe = document.createElement('iframe');
  iframe.id = 'nomadschat-iframe';
  iframe.src = apiOrigin + '/embed/' + encodeURIComponent(botId) + '?host=' + encodeURIComponent(hostOrigin);
  iframe.allow = 'clipboard-write';
  iframe.title = 'AI Assistant';

  iframeContainer.appendChild(iframe);
  root.appendChild(iframeContainer);
  root.appendChild(bubble);
  document.body.appendChild(root);

  // Toggle open / close
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      iframeContainer.classList.add('active');
      bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    } else {
      iframeContainer.classList.remove('active');
      bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>';
    }
  }

  bubble.addEventListener('click', toggleWidget);

  // Listen for iframe close messages
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'nomadschat_close') {
      if (isOpen) toggleWidget();
    }
  });

})();
