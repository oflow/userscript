// ==UserScript==
// @name           shift+click multiple check
// @description    Shift+Clickで適当にまとめてチェック
// @namespace      http://oflow.me/archives/441
// @compatibility  Firefox 31 (Greasemonkey), Chrome 37 (Tampermonkey)
// @include        http://*
// @include        https://*
// @exclude        http://www.google.tld/*
// @exclude        https://www.google.tld/*
// @version        1.3
// @grant          none
// ==/UserScript==

/*
 * 1.3
 *     @grant追加
 *     @excludeをgoogle.tldに変更
 *     input.checked = (true|false) でやってるとclickイベント見てるサイトで
 *     微妙な動作になってしまうのでclickイベント発生させて変更するようにした
 *
 * 1.2
 *     XPathからquerySelectorAllに変更
 *     同じ要素に何度もaddEventListener使ってる場合あるの修正
 * 1.1
 *     Gmailのチェックボックスの動作をできるだけ再現
 *     使いたいサイトでname属性が違うcheckboxの一覧があったのでいい加減にした
 *     要素の並び方次第では予想と大幅に変わる可能性がある
 *     DOMNodeModified, DOMNodeRemovedはもちろん見てないのでおかしくなる可能性がある
 *
 */

(function() {
    var prevCheckbox = null,
        checkboxes = null,
        checkboxLength = 0,
        inRange = 0;

    function init(doc, inserted) {
        if (doc.nodeType != 9 && !inserted) {
            return;
        }
        var elms = document.querySelectorAll('input[type="checkbox"]');
        checkboxLength = elms.length;
        if (!checkboxLength) {
            return;
        }

        for (var i = 0; i < checkboxLength; i++) {
            // addEventListener何度もしないように
            if (elms[i].getAttribute('data-multiple-check')) {
                continue;
            }
            elms[i].setAttribute('data-multiple-check', 'true');
            elms[i].addEventListener('click', function(e) {
                if (e.button == 0 && !inRange) {
                    multipleCheck(e);
                }
            }, false);
        }
        checkboxes = elms;
    }

    function multipleCheck(e) {
        var self = e.target, checked = self.checked, prev = prevCheckbox;
        prevCheckbox = self;

        if (!prev || !e.shiftKey || self == prev) {
            // シフト押してない, 同じのクリックしてたら止める
            return;
        }
        for (var i = 0; i < checkboxLength; i++) {
            var elm = checkboxes[i];
            if (inRange) {
                // 範囲内でチェック状態違うやつをクリック
                if (elm.checked != checked) {
                    click(elm);
                }
            }
            if (elm == prev || elm == self) {
                // 開始 or 終了地点
                if (elm.checked != checked) {
                    click(elm);
                }
                if (++inRange > 1) {
                    // クリックした順番が変わるかもしれないので終了地点もう一度
                    prevCheckbox = self;
                    inRange = 0;
                    break;
                }
            }
        }
    }
    function click(elm) {
        var e = document.createEvent('MouseEvents');
        e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        elm.dispatchEvent(e);

    }
    init(document, false);

    // 重いならこれやめるといいかも
    document.addEventListener('DOMNodeInserted', function(e) {
        var node = e.target;
        if (node.nodeType != 1) return;
        // この辺はよく追加されるけど無視していいだろうと
        if (/^(?:a|img|br|script)$/i.test(node.nodeName)) return;
        init(node, true);
    }, false);
})();
