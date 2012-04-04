// ==UserScript==
// @name           Togetterの残りを自動で開いとく
// @include        http://togetter.com/li/*
// @version        1.0
// ==/UserScript==


(function() {
    var nokori, count, e, title, span;
    nokori = document.evaluate('//a[starts-with(text(), "残りを読む")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    nokori = nokori.singleNodeValue;

    if (!nokori) return;
    count = parseInt(nokori.textContent.replace('残りを読む(', '').replace(')', ''));

    if (isNaN(count)) return;

    // 
    title = document.getElementsByClassName('info_title')[0].parentNode;
    title.appendChild(document.createElement('br'));
    span = document.createElement('span');
    span.appendChild(document.createTextNode('残り(' + count + ')'));
    span.style.cssText = 'display: inline-block; margin-top: 0.3em; font-weight: normal;';
    title.appendChild(span);

    if (count > 50) {
        alert('残り' + count + '件もあるぞ！');
        return;
    }

    e = document.createEvent('MouseEvents');
    e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    nokori.dispatchEvent(e);
})();
