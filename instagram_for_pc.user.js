// ==UserScript==
// @name           Instagram for PC
// @description    Instagramの画像を開いた時にI4PCとWebstagramへのリンクを追加する(俺はI4PC派)
// @version        1.4
// @include        http://instagr.am/p/*
// @exclude        https://*
// ==/UserScript==

(function() {
    var css = 'a.gm { text-decoration: none; text-transform: none; }';


    function InstagramForPC() {
        var username = document.getElementsByClassName('username')[0],
            info = document.getElementsByClassName('information')[0],
            middot = ' ' + String.fromCharCode(183) + ' ',
            a = document.createElement('a');

        if (!username || !info) return;
        username = username.textContent || username.innerText;
        info.appendChild(document.createTextNode(middot));
        a.className = 'gm'
        a.href = 'http://www.i4pc.jp/user/' + username;
        a.appendChild(document.createTextNode('I4PC'));
        info.appendChild(a);
        info.appendChild(document.createTextNode(middot));
        a = document.createElement('a');
        a.className = 'gm';
        a.href = 'http://web.stagram.com/n/' + username + '/';
        a.appendChild(document.createTextNode('Webstagram'));
        info.appendChild(a);
    }
    GM_addStyle(css);
    InstagramForPC();

} )();


