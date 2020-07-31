function isPrivateMode() {
  return new Promise(function detect(resolve) {
    var yes = function() { resolve(true); }; // is in private mode
    var not = function() { resolve(false); }; // not in private mode

    function detectChromeOpera() {
      // https://developers.google.com/web/updates/2017/08/estimating-available-storage-space
      var isChromeOpera = /(?=.*(opera|chrome)).*/i.test(navigator.userAgent) && navigator.storage && navigator.storage.estimate;
      if (isChromeOpera) {
        navigator.storage.estimate().then(function(data) {
          return data.quota < 120000000 ? yes() : not();
        });
      }
      return !!isChromeOpera;
    }

    function detectFirefox() {
      var isMozillaFirefox = 'MozAppearance' in document.documentElement.style;
      if (isMozillaFirefox) {
        if (indexedDB == null) yes();
        else {
          var db = indexedDB.open('inPrivate');
          db.onsuccess = not;
          db.onerror = yes;
        }
      }
      return isMozillaFirefox;
    }

    function detectSafari() {
      var isSafari = navigator.userAgent.match(/Version\/([0-9\._]+).*Safari/);
      if (isSafari) {
        var testLocalStorage = function() {
          try {
            if (localStorage.length) not();
            else {
              localStorage.setItem('inPrivate', '0');
              localStorage.removeItem('inPrivate');
              not();
            }
          } catch (_) {
            // Safari only enables cookie in private mode
            // if cookie is disabled, then all client side storage is disabled
            // if all client side storage is disabled, then there is no point
            // in using private mode
            navigator.cookieEnabled ? yes() : not();
          }
          return true;
        };

        var version = parseInt(isSafari[1], 10);
        if (version < 11) return testLocalStorage();
        try {
          window.openDatabase(null, null, null, null);
          not();
        } catch (_) {
          yes();
        }
      }
      return !!isSafari;
    }

    function detectEdgeIE10() {
      var isEdgeIE10 = !window.indexedDB && (window.PointerEvent || window.MSPointerEvent);
      if (isEdgeIE10) yes();
      return !!isEdgeIE10;
    }

    // when a browser is detected, it runs tests for that browser
    // and skips pointless testing for other browsers.
    if (detectChromeOpera()) return;
    if (detectFirefox()) return;
    if (detectSafari()) return;
    if (detectEdgeIE10()) return;
    
    // default navigation mode
    return not();
  });
}