(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    return s[s.length - 1];
  })();

  var baseUrl = script.src.replace('/embed.js', '');
  var formId = script.getAttribute('data-form-id');
  var mode = script.getAttribute('data-mode') || 'popup';
  var containerId = script.getAttribute('data-container');
  var height = script.getAttribute('data-height') || '600';
  var trigger = script.getAttribute('data-trigger') || 'button';
  var delay = parseInt(script.getAttribute('data-delay') || '0', 10) * 1000;

  window.QuizCRM = {
    open: function (fid) {
      var overlay = document.createElement('div');
      overlay.id = 'quizcrm-overlay';
      overlay.style.cssText = [
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'background:rgba(0,0,0,0.6);z-index:2147483647;',
        'display:flex;align-items:center;justify-content:center;',
        'animation:qcFadeIn 0.2s ease;',
      ].join('');

      var box = document.createElement('div');
      box.style.cssText = [
        'width:92%;max-width:700px;height:88vh;',
        'background:#fff;border-radius:20px;overflow:hidden;',
        'position:relative;animation:qcSlideUp 0.3s ease;',
        'box-shadow:0 24px 80px rgba(0,0,0,0.35);',
      ].join('');

      var closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = [
        'position:absolute;top:12px;right:12px;z-index:10;',
        'width:32px;height:32px;border-radius:50%;border:none;',
        'background:rgba(0,0,0,0.12);color:#333;font-size:18px;',
        'cursor:pointer;display:flex;align-items:center;justify-content:center;',
      ].join('');
      closeBtn.onclick = function () { document.body.removeChild(overlay); };

      var iframe = document.createElement('iframe');
      iframe.src = baseUrl + '/quiz/' + (fid || formId);
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.setAttribute('frameborder', '0');

      box.appendChild(closeBtn);
      box.appendChild(iframe);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) document.body.removeChild(overlay);
      });

      // Close on quiz complete (postMessage from iframe)
      window.addEventListener('message', function (e) {
        if (e.data === 'quizcrm:complete') {
          setTimeout(function () {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
          }, 2000);
        }
      });
    }
  };

  // Inject keyframe CSS
  var style = document.createElement('style');
  style.textContent = [
    '@keyframes qcFadeIn{from{opacity:0}to{opacity:1}}',
    '@keyframes qcSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}',
  ].join('');
  document.head.appendChild(style);

  if (!formId) return;

  if (mode === 'inline' && containerId) {
    var container = document.getElementById(containerId);
    if (container) {
      var inlineIframe = document.createElement('iframe');
      inlineIframe.src = baseUrl + '/quiz/' + formId;
      inlineIframe.style.cssText = 'width:100%;height:' + height + 'px;border:none;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.1);';
      inlineIframe.setAttribute('frameborder', '0');
      container.appendChild(inlineIframe);
    }
  } else if (trigger === 'auto') {
    setTimeout(function () { window.QuizCRM.open(formId); }, delay);
  } else if (trigger === 'exit') {
    var fired = false;
    document.addEventListener('mouseleave', function (e) {
      if (!fired && e.clientY < 10) { fired = true; window.QuizCRM.open(formId); }
    });
  }
})();
