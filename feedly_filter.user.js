// ==UserScript==
// @name           Feedly Filter
// @description    広告エントリーを非表示にするやつ
// @version        1.1
// @namespace      http://oflow.me/archives/1164
// @include        http://feedly.com/*
// @include        https://feedly.com/*
//
// @note           自動で消えないやつがある (U5Entry)
// @note           Mutation Observer使ってるので古いブラウザだと全く動かない
// ==/UserScript==

(function() {
    var feedly = {
        titles: [
            /^(?:[\[\(【]|)(?:PR|AD|INFO)/i,
            /管理人のブックマーク/,
            /^ダイジェストニュース/,
            /bokete/
        ],
        // URLフィルター入れようかと思ったけどそんなになかった
        urls: [
        ],
        // hide の場所が若干違う
        index: {
            'u0Entry': 0, 'u4Entry': 0, 'u100Frame': 1
        },
        observer: new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var elm = mutation.addedNodes[0];
                if (elm && elm.nodeName == 'DIV') {
                    feedly.filterEntry(elm);
                }

            });
        }),
        init: function() {
            this.observer.observe(document.body, {childList: true, subtree: true});
            window.addEventListener('beforeunload', this, true);
        },
        handleEvent: function(event) {
            if (event.type == 'beforeunload') {
                // this.debug(' disconnect()');
                this.observer.disconnect();
                window.removeEventListener('beforeunload', this, true);
            }
        },
        debug: function() {
            var i, l = arguments[0];
            for (i = 1; i < arguments.length; i++) {
                if (arguments[i]) l += ', ' + arguments[i];
            }
            unsafeWindow.console.log('[userscript][feedly_filter]' + l);
        },
        filterEntry: function(elm) {
            var a, i, title, read = false, className;
            if (!elm.className || !/(u[045]Entry|u100Frame)/.test(elm.className)) return;
            className = RegExp.$1;
            a = elm.getElementsByClassName('title')[0];
            // 既読なら非表示にするだけ
            if (a.className == 'title read') {
                read = true;
            }
            title = elm.getAttribute('data-title');
            for (i = 0; i < this.titles.length; i++) {
                if (!this.titles[i].test(title)) continue;
                this.debug('[hide] ' + title);
                this.hide(elm, read, className);
                break;
            }
        },
        hide: function(elm, read, className) {
            var tool = elm.getElementsByClassName('condensedTools')[0],
                action, e;

            if (read) {
                elm.style.display = 'none';
                return;
            }
            if (className == 'u0Entry') {
                // u0Entry (Title Only)
                action = tool.getElementsByTagName('img')[0];
            } else {
                // u100Frame (Full Articles), u5Entry (Cards), (u4Entry (Magagine)
                action = tool.getElementsByClassName('action')[this.index[className]];
            }
            if (!action) return;
            if (/mark as read and (?:hide|remove)/i.test(action.getAttribute('title'))) {
                e = document.createEvent('MouseEvents');
                e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                action.dispatchEvent(e);
            }
        }
    };
    feedly.init();
})();

