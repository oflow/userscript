// ==UserScript==
// @name           Google search thumbnail
// @description    Google検索のサムネを別のやつに変える
// @namespace      http://oflow.me/archives/59
// @compatibility  Greasemonkey (Firefox), Scriptish (Firefox), NinjaKit (Safari)
// @include        https://www.google.com/search*
// @include        https://www.google.com/webhp*
// @include        https://www.google.com/#hl=*
// @include        http://www.google.com/search*
// @include        http://www.google.com/webhp*
// @include        http://www.google.com/#hl=*
// @include        https://www.google.co.jp/search*
// @include        https://www.google.co.jp/webhp*
// @include        https://www.google.co.jp/#
// @include        https://www.google.co.jp/#sclient*
// @include        https://www.google.co.jp/#safe*
// @include        https://www.google.co.jp/#q=*
// @include        https://www.google.co.jp/#hl=*
// @include        https://www.google.co.jp/
// @include        http://www.google.co.jp/search*
// @include        http://www.google.co.jp/webhp*
// @include        http://www.google.co.jp/#
// @include        http://www.google.co.jp/#sclient*
// @include        http://www.google.co.jp/#q=*
// @include        http://www.google.co.jp/#hl=*
// @include        http://www.google.co.jp/

// @version        1.0
// @note           20130430
//                 Googleの仕様変更に対応
//                 簡単にサムネ取得できる画像投稿サービス(twipple)追加
//                 ニコニコ動画のスパムくさいサイトうざいな
// @note           20130304
//                 open.thumbshots.org から searchpreview.de に変更
// @note           20120817
//                 DOMNodeInsertedでdiv#iresを追加するように変わってたので対応
// @note           20120711
//                 httpsじゃない場合もあるので@include増やした
// @note           20120620
//                 サムネクリックできるようにリンク追加
//                 仕様変更に合わせてCSSを修正
// @note           httpsの時だけ有効
//                 (ただし画像取得はhttpなので信頼できるサイトの表示はなくなる)
// @note           商品検索などでレビューがあったときサムネイルが表示されてなかったのを修正
// @note           20111107
//                 サイトリンクが付いてる場合のCSSを修正
// @note           20111024-2
//                 Google Search Number Favicon使用時でもサムネ付くように対応
//                 AutoPagerize使用時に2ページ目以降サムネ付かなかったのを修正
//                 NinjaKitのJSLintで怒られないように修正
//
// @memo           li.g > div.vsc が li.g > div.rc になってる
//                 インスタントプレビューなくなったかもしれん

// ==/UserScript==
(function () {
    var url = {
        thumbshots: 'https://searchpreview.de/preview?s=%url%',
        amazon: 'http://images-jp.amazon.com/images/P/%asin%.09._AA120_.jpg',
        youtube: 'http://i.ytimg.com/vi/%id%/default.jpg',
        nicovideo: 'http://tn-skr%number%.smilevideo.jp/smile?i=%id%',
        twipple: 'http://p.twipple.jp/show/thumb/%id%'
    };

    var regexp = {
        asin: /amazon.+(?:dp|ASIN|gp\/product)\/([0-9A-Z]{10})/,
        nicovideo: /(?:www\.nicovideo\.jp\/watch|nico\.ms|nicoviewer\.net|nicozon\.net\/watch|nicosoku\.com\/watch|nico\.oh-web\.jp)\/sm([0-9]+)/,
        youtube: /www\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_\-]+)/,
        twipple: /p\.twipple\.jp\/([a-zA-Z0-9]+)/
    };

    var css = '';
    // 高さ調整
    css += '.g.thumbshots,';
    css += '.g.thumbshots > .vsc { min-height: 93px; }';
    // 画像の枠とかは他のボタンと同じような感じ
    css += '.g.thumbshots .thumb img { width: 111px; height: 82px; position: absolute; display: inline-block; border: 3px solid #f1f1f1; outline: 1px solid #d5d5d5; margin-top: 3px; z-index: 2; }';
    css += '.g.thumbshots .thumb:hover img { outline-color: #c1c1c1; }';
    css += '.g.thumbshots .thumb:active img { outline-color: #4d90fe; }';
    // 画像挿入するので位置調整
    css += '.g.thumbshots > .rc,';
    css += '.g.thumbshots > .vsc,';
    css += '.g.thumbshots > .mbl { margin-left: 126px; }';
    // サイトリンクの位置調整
    css += '.g.thumbshots > .nrgt { margin-left: 135px; }';
    // Amazonの商品画像は高さが違うので調整
    css += '.g.amazon .thumb img { height: 120px; border-color: transparent; outline-width: 0; }';
    css += '.g.amazon { min-height: 125px !important; }';
    // 画像投稿サービス
    css += '.g.photo .thumb img { width: auto; height: auto; max-width: 111px; max-height: 93px; }';
    // 動画サムネの背景が黒になってたり枠線付いてるので消す
    css += '.g.video .s .th { overflow: visible !important; background: transparent !important; border: 0 !important; z-index: 200; }';
    css += '.g.video .s .th a { border: 0 !important; }';
    // 本来のサムネを消す
    css += '.g.video .th img { display: none !important; }';
    // ► 3:20 とか時間表示は残す
    css += '.g.video .th .vdur { position: absolute !imoportant; right: auto !important; left: -123px; margin-bottom: 3px; z-index: 200; }';
    // 動画用の位置調整
    css += '.g.video .s > div { position: absolute !important; margin-left: 0 !important; }';
    css += '.g.video img[class*="vidthumb"] { display: none !important; }';
    // ～の他の動画≫
    css += '.g.video .vsc + div { margin-top: 12px !important; }';

    var googleThumbnail = {
        init: function () {
            GM_addStyle(css);
            document.body.addEventListener('DOMNodeInserted', this, false);
            window.addEventListener('unload', this, false);
            this.checkResult(document.body);
        },
        handleEvent: function (event) {
            var elm = event.target, i;
            switch (event.type) {
            case 'DOMNodeInserted':
                if (elm.nodeName == 'LI' || elm.nodeName == 'OL') {
                    // console.debug(elm.nodeName, elm.id, elm.className);
                    // Ajaxで追加         = LI
                    // AutoPagerizeで追加 = OL
                    this.checkResult(elm);
                } else if (elm.nodeName == 'DIV' && elm.id == 'ires') {
                    // console.debug(elm);
                    // 2012-08-17 ajaxで追加
                    this.checkResult(elm);

                }
                break;
            case 'unload':
                document.body.removeEventListener('DOMNodeInserted', this, false);
                window.removeEventListener('unload', this, false);
                break;
            case 'load':
                // Amazonの画像で横幅1pxのがあるので消す
                if (elm.nodeName == 'IMG' && elm.naturalWidth == 1) {
                    this.remove(elm);
                }
                break;
            }
        },
        checkResult: function (elm) {
            var g = elm.getElementsByClassName('g'),
                length = g.length,
                i, a, li;

            // li.g > a > img.thumbshots
            // li.g > div.vsc > h3
            for (i = 0; i < length; i += 1) {
                li = g[i];
                // .g に id, 他のclass が付いてたらたぶん違う
                if (li.id || li.className != 'g') {
                    continue;
                }
                a = li.getElementsByTagName('a')[0];
                if (!a) {
                    continue;
                }
                // onmosedown は削除しないで空にしとく
                if (a.hasAttribute('onmousedown')) {
                    a.setAttribute('onmousedown', '');
                }
                // li.videobox がある場合はやめとく
                if (li.className.indexOf('videobox') != -1) {
                    continue;
                }
                // 子要素にclass="vresult"がある場合はやめとく(動画の横並びの時など)
                if (li.getElementsByClassName('vresult')[0]) {
                    continue;
                }

                this.setWebnail(li, a.href);
            }
        },
        setWebnail: function (li, href) {
            var id,
                w   = 'abcdefghijklmnopqrstuvwxyz',
                a   = document.createElement('a'),
                img = document.createElement('img');

            a.href = href;
            a.className = 'thumb';
            li.className += ' bb';
            if (regexp.asin.test(href)) {
                // アマゾンっぽかったら商品画像
                li.className += ' amazon';
                img.src = url.amazon.replace('%asin%', RegExp.$1);
                img.addEventListener('load', this, false);
            } else if (regexp.youtube.test(href)) {
                // Youtube
                li.className += ' video youtube';
                img.src = url.youtube.replace('%id%', RegExp.$1);
            } else if (regexp.nicovideo.test(href)) {
                // ニコニコ動画
                id = RegExp.$1;
                li.className += ' video nicovideo';
                img.src = url.nicovideo.replace('%id%', id)
                                       .replace('%number%', (parseInt(id, 10) % 4 + 1));
            } else if (regexp.twipple.test(href)) {
                // 情弱
                li.className += ' photo';
                img.src = url.twipple.replace('%id%', RegExp.$1);
            } else {
                if (li.getAttribute('style')) {
                    return;
                }
                // 他はサムネ追加
                href = encodeURIComponent(href);
                // w = w.charAt(Math.floor(Math.random() * 24));
                // url.thumbshots.replace('%[w]%', w);
                img.src = url.thumbshots.replace('%url%', href);
            }

            a.appendChild(img);
            li.className += ' thumbshots';
            li.insertBefore(a, li.firstChild);
        },
        remove: function (elm) {
            elm.removeEventListener('load', this, false);
            var li = elm.parentNode.parentNode;
            li.className = li.className.replace(/\s(?:amazon|thumbshots|nicovideo)/g, '');
            li.removeChild(elm.parentNode);
        }
    };
    googleThumbnail.init();
})();
