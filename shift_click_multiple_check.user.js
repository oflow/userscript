// ==UserScript==
// @name         shift+click multiple check
// @description  Shift+Clickで適当にまとめてチェック
// @namespace    http://oflow.me/archives/441
// @include      http://*
// @include      https://*
// @exclude      http://www.google.com/*
// @exclude      http://www.google.co.jp/*
// @exclude      https://www.google.com/*
// @exclude      https://www.google.co.jp/*
// @version      1.1
// @note         XPathからquerySelectorAllに変更
//               同じ要素に何度もaddEventLister使ってる場合あるの修正
// @note         DOMNodeInsertedの所間違ってた…
// ==UserScript==

// Gmailのチェックボックスの動作をできるだけ再現
// 使いたいサイトでname属性が違うcheckboxの一覧があったのでいい加減にした
// 要素の並び方次第では予想と大幅に変わる可能性がある
// DOMNodeModified, DOMNodeRemovedはもちろん見てないのでおかしくなる可能性がある

(function() {
    var prevCheckbox = null, checkboxes = null, checkboxLength = 0;

    function init(doc, inserted) {
        if (doc.nodeType != 9 && !inserted) return;
        // 追加されたやつにcheckboxあるか確認する
        if (inserted && !doc.querySelector('input[type="checkbox"]')) return;

        var elms = document.querySelectorAll('input[type="checkbox"]');
        checkboxLength = elms.length;
        if (!checkboxLength) return;

        for (var i = 0; i < checkboxLength; i++) {
            if (elms[i].getAttribute('data-multiple-check')) continue;
            elms[i].setAttribute('data-multiple-check', 'true');
            elms[i].addEventListener('click', function(e) {
                if (e.button == 0) multipleCheck(e);
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

        // 範囲内にあるか確認してチェック状態をどうにか
        for (var i = 0, inRange = 0; i < checkboxLength; i++) {
            var elm = checkboxes[i];
            if (inRange) elm.checked = checked;
            if (elm == prev || elm == self) {
                // 開始 or 終了地点
                elm.checked = checked;
                if (++inRange > 1) break;
            }
        }
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
