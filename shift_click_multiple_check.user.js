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
// @version      1.0.20110920
// @note         DOMNodeInsertedの所間違ってた…
// ==UserScript==

// 使いたいサイトでname属性が違うcheckboxの一覧があったのでいい加減にした
// 要素の並び方次第では予想と大幅に変わる可能性がある
// DOMNodeModified, DOMNodeRemovedはもちろん見てないのでおかしくなる可能性がある

(function() {
    var prevCheckbox = null, checkboxes = null, checkboxLength = 0;

    function init(doc) {
        // XPathでチェックボックス取得
        var elms = getCheckboxesByXPath(doc, '//input[@type="checkbox"]');
        checkboxLength = elms.length;
        if (!checkboxLength) return;
        for (var i = 0; i < checkboxLength; i++) {
            elms[i].addEventListener('click', function(e) {
                if (e.button == 0) multipleCheck(e);
            }, false);
        }

        if (doc.nodeType != 9) {
            // 更新されてたら全部取得しなおす
            checkboxes = getCheckboxesByXPath(document, '//input[@type="checkbox"]');
            checkboxLength = checkboxes.length;
        } else {
            checkboxes = elms;
        }
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

    function getCheckboxesByXPath(doc, xpath) {
        // application/xhtml+xmlの場合そのままだと無理
        if (document.documentElement.namespaceURI) {
            xpath = xpath.replace(/\/\//g, '//html:');
        }

        var nodes = document.evaluate(xpath, doc, function(prefix) {
            return (prefix == 'html' ? 'http://www.w3.org/1999/xhtml' : null);
        }, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        var elms = [];
        for (var i = 0, length = nodes.snapshotLength; i < length; i++) {
            elms.push(nodes.snapshotItem(i));
        }

        return elms;
    }

    init(document);
    // 重いならこれやめるといいかも
    document.addEventListener('DOMNodeInserted', function(e) {
        var node = e.target;
        if (node.nodeType != 1) return;
        // この辺はよく追加されるけど無視していいだろうと
        if (/^(?:a|img|br)$/i.test(node.nodeName)) return;
        init(node);
    }, false);
})();
