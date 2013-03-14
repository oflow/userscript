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
// @note           20130304
//                 open.thumbshots.org から capture.heartrails.com に変更
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
// ==/UserScript==
(function () {
    var url = {
//        thumbshots: 'http://open.thumbshots.org/image.pxf?url=%url%',
        thumbshots: 'http://capture.heartrails.com/120x90/?%url%',
        amazon: 'http://images-jp.amazon.com/images/P/%asin%.09._AA120_.jpg',
        youtube: 'http://i.ytimg.com/vi/%id%/default.jpg',
        nicovideo: 'http://tn-skr%number%.smilevideo.jp/smile?i=%id%'
    };

    var regexp = {
        asin: /amazon.+(?:dp|ASIN|gp\/product)\/([0-9A-Z]{10})/,
        nicovideo: /(?:www\.nicovideo\.jp\/watch|nico\.ms)\/sm([0-9]+)/,
        youtube: /www\.youtube\.com\/watch\?.*v=([a-zA-Z0-9\-]+)/
    };

    var css = '';
    css += '.g.thumbshots { min-height: 95px; }';
    css += '.g.thumbshots .thumb:active { outline: 1px solid #dd4b39; }';
    css += '.g.thumbshots .thumb img { width: 120px; height: 90px; position: absolute; display: inline-block; border: 3px solid #e5e5e5; margin-top: 0px; outline: 1px solid #ccc; z-index: 2; }';
    css += '.g.thumbshots > .vsc, .g.thumbshots > .mbl { margin-left: 135px; }';
    css += '.g.thumbshots > .nrgt { margin-left: 155px; }';
    // Amazonの商品画像は高さが違うので修正
    css += '.g.amazon .thumb img { height: 120px; border-color: transparent; outline-width: 0; }';
    css += '.g.amazon { min-height: 125px !important; }';
    // 動画サムネの背景が黒になってたり枠線付いてるので消す
    css += '.g.video .ts .th { overflow: visible !important; background: transparent !important; border: 0 !important; z-index: 200; }';
    css += '.g.video .ts .th a { border: 0 !important; }';
    // 本来のサムネ
    css += '.g.video .ts td[width] { background: transparent !important; border: 0 !important; padding: 0 !important;}';
    css += '.g.video .ts td[width] > div { position: absolute !important; width: 1px !important; height: 1px !important; }';
    css += '.g.video img[class*="vidthumb"] { display: none !important; }';
    // ► 3:20 とか時間表示は残す
    css += '.g.video td > .th a span { position: absolute !imoportant; right: auto !important; left: -132px; z-index: 200; }';
    // ～の他の動画≫
    css += '.g.video .vsc + div { margin-top: 12px !important; }';
    // 元々あるプレビューボタン(≫)を消す
    // sig属性消してるのでクリックしても表示されない
    css += '.vspib, #vspb { display: none !important; }';
    var googleThumbnail = {
        init: function () {
            GM_addStyle(css);
            document.body.addEventListener('DOMNodeInserted', this, false);
            window.addEventListener('unload', this, false);

            this.setWebnail(document.body);
        },
        handleEvent: function (event) {
            var elm = event.target, i;
            switch (event.type) {
            case 'DOMNodeInserted':
                if (elm.nodeName == 'LI' || elm.nodeName == 'OL') {
                    // console.debug(elm.nodeName, elm.id, elm.className);
                    // Ajaxで追加         = LI
                    // AutoPagerizeで追加 = OL
                    this.setWebnail(elm);
                } else if (elm.nodeName == 'DIV' && elm.id == 'ires') {
                    // console.debug(elm);
                    // 2012-08-17 ajaxで追加
                    this.setWebnail(elm);

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
        setWebnail: function (elm) {
            var vsc = elm.getElementsByClassName('vsc'),
                length = vsc.length,
                i, a, href, li, thumb, img, anchor;

            for (i = 0; i < length; i += 1) {
                // div.vscのsig属性を消すとプレビューでない
                vsc[i].removeAttribute('sig');
                if (vsc[i].className != 'vsc') {
                    // vsc以外のクラスが付いてると元々サムネ付いてるはず
                    continue;
                }
                // a class="l"がなかったら多分違う
                a = vsc[i].getElementsByClassName('l')[0];
                if (!a) {
                    continue;
                }
                if (a.hasAttribute('onmousedown')) {
                    a.removeAttribute('onmousedown');
                }
                href = a.href;

                li = vsc[i].parentNode;
                // li class="videobox"がある場合はやめとく
                if (li.className.indexOf('videobox') != -1) {
                    continue;
                }
                // 子要素にclass="vresult"がある場合はやめとく(動画の横並びの時など)
                if (li.getElementsByClassName('vresult')[0]) {
                    continue;
                }
                // こっからは多分サムネ置き換えるのでクラス追加しとく
                li.className += ' thumbshots';

                anchor = li.insertBefore(document.createElement('a'), vsc[i]);
                anchor.href = href;
                anchor.className = 'thumb';
                img = anchor.appendChild(document.createElement('img'));

                if (regexp.asin.test(href)) {
                    // アマゾンっぽかったら商品画像
                    li.className += ' amazon';
                    img.src = url.amazon.replace('%asin%', RegExp.$1);
                    img.addEventListener('load', this, false);
                } else if (regexp.youtube.test(href)) {
                    // Youtube
                    id = RegExp.$1;
                    li.className += ' video youtube';
                    img.src = url.youtube.replace('%id%', id);
                } else if (regexp.nicovideo.test(href)) {
                    // ニコニコ動画
                    id = RegExp.$1;
                    li.className += ' video nicovideo';
                    img.src = url.nicovideo.replace('%id%', id).replace('%number%', (parseInt(id, 10) % 4 + 1));
                } else {
                    // 他はopen.thumbshots.org
                    href = encodeURIComponent(href);
                    img.src = url.thumbshots.replace('%url%', href);
                }
            }
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
