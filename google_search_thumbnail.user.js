// ==UserScript==
// @name           Google search thumbnail
// @description    Google検索のサムネをopen.thumbshots.orgのに変える
// @namespace      http://oflow.me/archives/59
// @compatibility  Greasemonkey (Firefox), Scriptish (Firefox), NinjaKit 0.8.3 (Safari)
// @include        https://www.google.com/search*
// @include        https://www.google.com/webhp*
// @include        https://www.google.co.jp/search*
// @include        https://www.google.co.jp/#
// @include        https://www.google.co.jp/#sclient*
// @include        https://www.google.co.jp/#q=*
// @include        https://www.google.co.jp/#hl=*
// @include        https://www.google.co.jp/webhp*
// @include        https://www.google.co.jp/search*
// @include        https://www.google.co.jp/
// @version        1.0.20120401
// @note           httpsの時だけ有効
//                 (ただし画像取得はhttpなので信頼できるサイトの表示はなくなる)
// @note           商品検索などでレビューがあったときサムネイルが表示されてなかったのを修正
// @note           1.0.20111107
//                 サイトリンクが付いてる場合のCSSを修正
// @note           1.0.20111024-2
//                 Google Search Number Favicon使用時でもサムネ付くように対応
//                 AutoPagerize使用時に2ページ目以降サムネ付かなかったのを修正
//                 NinjaKitのJSLintで怒られないように修正
// ==/UserScript==
(function () {
    var url = {
        thumbshots: 'http://open.thumbshots.org/image.pxf?url=%url%',
        amazon: 'http://images-jp.amazon.com/images/P/%asin%.09._AA120_.jpg',
        youtube: 'http://i.ytimg.com/vi/%id%/default.jpg',
        nicovideo: 'http://tn-skr%number%.smilevideo.jp/smile?i=%id%'
    };

    var regexp = {
        asin: /amazon.+(?:dp|ASIN|gp\/product)\/([0-9A-Z]{10})/,
        nicovideo: /(?:www\.nicovideo\.jp\/watch|nico\.ms)\/sm([0-9]+)/,
        youtube: /www\.youtube\.com\/watch\?.*v=([a-zA-Z0-9\-]+)/
    };

    var css = '.g.thumbshots img.thumb, .g.amazon img.thumb, .g.nicovideo img.thumb, .g.youtube img.thumb { width: 120px; height: 90px; position: absolute; display: inline-block; border: 3px solid #e5e5e5; margin-top: 0px; outline: 1px solid #ccc; z-index: 2;}';
    css += '.g.amazon img.thumb { height: 120px; border-color: transparent; outline-width: 0; }';
    css += '.g.youtube a img, .g.nicovideo a img { position: absolute; left: -33px; top: 70px; outline: 0; }';
    css += '.g.youtube td[width="1%"], .g.nicovideo td[width="1%"] { position: absolute !important; }';
    css += '.g.youtube td[width="1%"] > div, .g.nicovideo td[width="1%"] > div { overflow: visible !important; }';
    css += '.g.youtube td[width="1%"] a > div > img, .g.nicovideo td[width="1%"] a > div > img { display: none !important; }';
    css += '.g.youtube td[width="1%"] a > span { right: auto !important; left: -132px; z-index: 200; }';
    css += '.g.youtube td[width="1%"] a, .g.nicovideo td[width="1%"] a { outline: none; }';
    css += '.g.thumbshots > .vsc, .g.thumbshots > .mbl { margin-left: 135px; }';
    css += '.g.thumbshots > .nrgt { margin-left: 155px; }';
    css += '.g.thumbshots { min-height: 95px; }';
    css += '.g.amazon { min-height: 125px; }';
    css += '.vspib, #vspb { display: none !important; }';
    css += '.r > img { vertical-align: text-bottom; margin-right: 2px; }';
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
                    // Ajaxで追加         = LI
                    // AutoPagerizeで追加 = OL
                    this.setWebnail(elm);
                } else if (elm.nodeName == 'DIV' && elm.className == 'vspi') {
                    // どの場合これになるんだっけ…
                    // console.debug(elm);
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
                i, a, href, li, thumb;

            for (i = 0; i < length; i += 1) {
                // div.vscのsig属性を消すとプレビューでない
                vsc[i].removeAttribute('sig');
                if (vsc[i].className != 'vsc') {
                    // vsc以外のクラスが付いてると元々サムネ付いてるはず
                    continue;
                }
                a = vsc[i].getElementsByClassName('l')[0];
                if (!a) {
                    continue;
                }
                // href属性の変な文字ついてる事があったので消す
                href = a.href.replace(/(?:^.*\/url\?q=|&sa=.+$)/, '');

                li = vsc[i].parentNode;
                // class="g" な時があるのでimgタグがあったらやめる
                thumb = li.getElementsByTagName('img');
                // imgタグがYoutubeだったりしたらやっぱり置き換える
                // src="/images/nav..." → レビューの☆だったりする
                if (thumb[0] && !/(?:youtube\.com|nicovideo\.jp)/.test(href) && !/(?:\/s2\/favicons|\/images\/nav)/.test(thumb[0].src)) {
                    continue;
                }
                // class="g", "w0"がないで判断してたけどダメになった
                // "videobox"がある場合はやめとく
                if (li.className.indexOf('video') != -1) {
                    continue;
                }
                li.className += ' thumbshots';

                var img = li.insertBefore(document.createElement('img'), vsc[i]);
                img.className = 'thumb';

                if (regexp.asin.test(href)) {
                    // アマゾンっぽかったら商品画像
                    li.className += ' amazon';
                    img.src = url.amazon.replace('%asin%', RegExp.$1);
                    img.addEventListener('load', this, false);
                } else if (regexp.youtube.test(href)) {
                    // Youtube
                    id = RegExp.$1;
                    li.className += ' youtube';
                    img.src = url.youtube.replace('%id%', id);
                } else if (regexp.nicovideo.test(href)) {
                    // ニコニコ動画
                    id = RegExp.$1;
                    li.className += ' nicovideo';
                    img.src = url.nicovideo.replace('%id%', id).replace('%number%', (parseInt(id, 10) % 4 + 1));
                } else {
                    // 他はopen.thumbshots.org
                    // href = encodeURIComponent(href);
                    img.src = url.thumbshots.replace('%url%', href);
                }
            }
        },
        remove: function (elm) {
            elm.removeEventListener('load', this, false);
            var li = elm.parentNode;
            li.className = li.className.replace(/\s(?:gmthumb|amazon|thumbshots|nicovideo)/g, '');
            li.removeChild(elm);
        }
    };
    googleThumbnail.init();
})();
