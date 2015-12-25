// ==UserScript==
// @name           Google search thumbnail
// @description    Google検索のサムネを別のやつに変える
// @namespace      http://oflow.me/archives/1066
// @compatibility  Firefox 31-39 (Greasemonkey), Chrome 37 (Tampermonkey)
// @include        https://www.bing.com/search*
// @include        http://www.bing.com/search*
// @include        https://www.google.tld/search*
// @include        https://www.google.tld/webhp*
// @include        https://www.google.tld/#
// @include        https://www.google.tld/#sclient*
// @include        https://www.google.tld/#safe*
// @include        https://www.google.tld/#q=*
// @include        https://www.google.tld/#hl=*
// @include        https://www.google.tld/
// @include        http://www.google.tld/search*
// @include        http://www.google.tld/webhp*
// @include        http://www.google.tld/#
// @include        http://www.google.tld/#sclient*
// @include        http://www.google.tld/#safe*
// @include        http://www.google.tld/#q=*
// @include        http://www.google.tld/#hl=*
// @include        http://www.google.tld/
// @grant          GM_addStyle
// @version        1.0.9
// ==/UserScript==

/*
 * 20150727
 *     bing検索に.gなどないのでCSS修正とAutoPagerize併用でもなんとか動くように修正
 * 20150727
 *     div.gにクラス名追加してたらAutoPagerizeが動かなくなるのでdata-***に変更
 *     "pageElement": "id('res')// (略) /div[@class='g']" ←これ
 * 20150724
 *     AutoPagerizeを使っているとき2ページ目以降にサムネイル付かないのをまた修正
 * 20150215
 *     AutoPagerizeを使っているとき2ページ目以降にサムネイル付かないのを修正
 * 20140922
 *     @grant GM_addStyle 追加
 *     各国のgoogleに対応できるように@includeをgoogle.tldに変更
 *     ニュース検索で画像が2重に表示されるの修正したつもり
 *     誰も使ってなさそうなbing検索がid,class変わってたので対応
 * 20140109
 *     サイトリンク付きがずれるのでCSS修正
 * 20130521
 *     searchpreview.deを適当な方法で対応
 *     Bingでもやや強引に表示
 * 20130430
 *     Googleの仕様変更に対応
 *     簡単にサムネ取得できる画像投稿サービス(twipple)追加
 *     ニコニコ動画のスパムくさいサイトうざいな
 * 20130304
 *     open.thumbshots.org から searchpreview.de に変更
 * 20120817
 *     DOMNodeInsertedでdiv#iresを追加するように変わってたので対応
 * 20120711
 *     httpsじゃない場合もあるので@include増やした
 * 20120620
 *     サムネクリックできるようにリンク追加
 *     仕様変更に合わせてCSSを修正
 *     httpsの時だけ有効
 *     (ただし画像取得はhttpなので信頼できるサイトの表示はなくなる)
 *     商品検索などでレビューがあったときサムネイルが表示されてなかったのを修正
 * 20111107
 *     サイトリンクが付いてる場合のCSSを修正
 * 20111024-2
 *     Google Search Number Favicon使用時でもサムネ付くように対応
 *     AutoPagerize使用時に2ページ目以降サムネ付かなかったのを修正
 *     NinjaKitのJSLintで怒られないように修正
 * @memo
 *     li.g > div.vsc が li.g > div.rc になってる
 *     li.gだったのがdiv.gになってる
 */

(function () {
    var url = {
        thumbshots: 'https://jp.searchpreview.de/preview?s=%url%',
        amazon: 'http://images-jp.amazon.com/images/P/%asin%.09._AA120_.jpg',
        youtube: 'https://i.ytimg.com/vi/%id%/default.jpg',
        nicovideo: 'http://tn-skr%number%.smilevideo.jp/smile?i=%id%'
    };

    var regexp = {
        asin: /amazon.+(?:dp|ASIN|gp\/product)\/([0-9A-Z]{10})/,
        nicovideo: /(?:www\.nicovideo\.jp\/watch|nico\.ms|nicoviewer\.net|nicozon\.net\/watch|nicosoku\.com\/watch|nico\.oh-web\.jp)\/sm([0-9]+)/,
        youtube: /www\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_\-]+)/
    };

    var css = '\
         /* 高さ調整 */\
        [data-thumbshots],\
        [data-thumbshots] > .vsc {\
            min-height: 93px;\
        }\
        /* 画像の枠とかは他のボタンと同じような感じ */\
        [data-thumbshots] .thumb img {\
            width: 111px; height: 82px;\
            position: absolute; display: inline-block;\
            border: 3px solid #f1f1f1; outline: 1px solid #d5d5d5;\
            margin-top: 3px; z-index: 2;\
        }\
        /* img:hover */\
        [data-thumbshots] .thumb:hover img { outline-color: #c1c1c1; }\
        /* img:active */\
        [data-thumbshots] .thumb:active img { outline-color: #4d90fe; }\
        /* 画像挿入するので位置調整 */\
        [data-thumbshots] > .rc,\
        [data-thumbshots] > div:not([class]),\
        [data-thumbshots] > .vsc,\
        [data-thumbshots].b_algo > h2,\
        [data-thumbshots].b_algo > div,\
        [data-thumbshots] > .ts,\
        [data-thumbshots] > .mbl {\
            margin-left: 126px;\
        }\
        /* サイトリンクの位置調整 */\
        [data-thumbshots] > div > .nrgt {\
            margin-left: 10px !important; width: 420px !important;\
        }\
        /* サイトリンクの幅調整 */\
        [data-thumbshots] .mslg .vsc {\
            width: 200px !important;\
        }\
        [data-thumbshots] .mslg .vsc .st {\
            width: 190px !important;\
        }\
        /* Yahoo */\
        [data-thumbshots] > .hd,\
        [data-thumbshots] > .bd {\
            margin-left: 126px;\
        }\
        /* Amazonの商品画像は高さが違うので調整 */\
        [data-thumbshots="amazon"] .thumb img {\
            height: 120px; border-color: transparent; outline-width: 0;\
        }\
        [data-thumbshots="amazon"] {\
            min-height: 125px !important;\
        }\
        /* 画像投稿サービス */\
        .photo .thumb img {\
            width: auto; height: auto; max-width: 111px; max-height: 93px;\
        }\
        /* 動画サムネの背景が黒になってたり枠線付いてるので消す */\
        [data-thumb-type="video"] .s .th {\
            overflow: visible !important;\
            background: transparent !important; border: 0 !important; z-index: 200;\
        }\
        [data-thumb-type="video"] .s .th a { border: 0 !important; }\
        /* 本来のサムネを消す */\
        [data-thumb-type="video"] .th img { display: none !important; }\
        /* ► 3:20 とか時間表示は残す */\
        [data-thumb-type="video"] .th .vdur {\
            position: absolute !imoportant;\
            right: auto !important; left: -123px;\
            margin-bottom: 3px; z-index: 200;\
        }\
        /* 動画用の位置調整 */\
        [data-thumb-type="video"] .s > div { position: absolute !important; margin-left: 0 !important; }\
        [data-thumb-type="video"] img[class*="vidthumb"] { display: none !important; }\
        /* ～の他の動画≫ */\
        [data-thumb-type="video"] .vsc + div { margin-top: 12px !important; }\
    '.replace(/\s+/g, ' ');


    var googleThumbnail = {
        init: function () {
            GM_addStyle(css);
            document.body.addEventListener('DOMNodeInserted', this, false);
            window.addEventListener('unload', this, false);
            this.checkResult(document.body);
        },
        initBing: function() {
            GM_addStyle(css);
            document.body.addEventListener('DOMNodeInserted', this, false);
            window.addEventListener('unload', this, false);
            this.checkBing(document.body);
        },
        handleEvent: function (event) {
            var elm = event.target, i;
            switch (event.type) {
            case 'DOMNodeInserted':
                if (elm.nodeName == 'DIV' && (elm.getAttribute('data-ved') || elm.id == 'ires' || elm.className == 'g')) {
                    // console.debug(elm);
                    // 2012-08-17 ajaxで追加
                    // 2014-10-31 div[data-ved="hogehoge"]になった
                    // 2015-07-24 AutoPagerizeで div.g が追加される
                    this.checkResult(elm);

                } else if (elm.nodeName == 'LI' || elm.nodeName == 'OL') {
                    // console.debug(elm.nodeName, elm.id, elm.className);
                    // Ajaxで追加         = LI
                    // AutoPagerizeで追加 = OL
                    // 仕様変更でLI, OLだったものがDIV厨になった
                    // ということでLI追加はBing検索だけだろうと思う
                    if (elm.className.indexOf('b_algo') != -1) {
                        this.checkBing(elm);
                    } else {
                        // 念のため残す
                        this.checkResult(elm);
                    }
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
        checkBing: function (elm) {
            var li, a;
            if (elm.nodeName == 'LI' && elm.className.indexOf('b_algo') != -1) {
                a = elm.getElementsByTagName('a')[0];
                if (!a) {
                    return;
                }
                this.setWebnail(elm, a.href);
            } else {
                li = elm.querySelectorAll('#b_results > .b_algo');
                for (i = 0; i < li.length; i += 1) {
                    this.checkBing(li[i]);
                }
            }
        },
        checkResult: function (elm) {
            var elms = (elm.className == 'g' ? [elm] : elm.getElementsByClassName('g')),
                length = elms.length,
                i, a, g, div;

            // div.g > a > img.thumbshots
            // div.g > div.vsc > h3
            for (i = 0; i < length; i += 1) {
                g = elms[i];
                // .g に id, 他のclass が付いてたらたぶん違う
                // #newsbox, #imagebox_bigimages
                if (g.id || g.className != 'g') {
                    continue;
                }
                a = g.getElementsByTagName('a')[0];
                if (!a) {
                    continue;
                }
                // ニュース検索したときに画像が付いてたらやめる
                if (a.getElementsByTagName('img')[0]) {
                    continue;
                }
                // onmosedown は削除しないで空にしとく
                if (a.hasAttribute('onmousedown')) {
                    a.setAttribute('onmousedown', '');
                }
                // 子要素に div.vresult がある場合はやめとく(動画の横並びの時など
                if (g.getElementsByClassName('vresult')[0]) {
                    continue;
                }
                // 子要素に div.vsc.vslru がある場合はたぶん地図付き
                div = g.getElementsByTagName('div')[0];
                if (!div) {
                    continue;
                } else if (div.className == 'vsc') {
                    // .vslru は後でつく
                    if (div.getAttribute('data-extra')) {
                        if (div.getAttribute('data-extra').indexOf('ludocid') != -1) {
                            a = g.getElementsByTagName('a')[1];
                            g.removeAttribute('style');
                        }
                    }
                }

                this.setWebnail(g, a.href);
            }
        },
        setWebnail: function (g, href) {
            var id,
                w   = 'abcdefghijklmnopqrstuvwxyz',
                a   = document.createElement('a'),
                img = document.createElement('img');
                
            a.href = href;
            a.className = 'thumb';
            if (regexp.asin.test(href)) {
                // アマゾンっぽかったら商品画像
                //g.className += ' amazon';
                g.setAttribute('data-thumbshots', 'amazon');
                img.src = url.amazon.replace('%asin%', RegExp.$1);
                img.addEventListener('load', this, false);
            } else if (regexp.youtube.test(href)) {
                // Youtube
                g.setAttribute('data-thumbshots', 'youtube');
                g.setAttribute('data-thumb-type', 'video');
                img.src = url.youtube.replace('%id%', RegExp.$1);
            } else if (regexp.nicovideo.test(href)) {
                // ニコニコ動画
                id = RegExp.$1;
                g.setAttribute('data-thumb-type', 'nicovideo')
                g.setAttribute('data-thumbshots', 'video');
                img.src = url.nicovideo.replace('%id%', id)
                                       .replace('%number%', (parseInt(id, 10) % 4 + 1));

            } else {
                if (g.getAttribute('style')) {
                    return;
                }
                // 他はサムネ追加
                href = encodeURIComponent(href);
                img.src = url.thumbshots.replace('%url%', href);
                g.setAttribute('data-thumbshots', '_');
            }

            a.appendChild(img);
            g.insertBefore(a, g.firstChild);
        },
        remove: function (elm) {
            elm.removeEventListener('load', this, false);
            var g = elm.parentNode.parentNode;
            g.removeAttribute('data-thumbshots');
            g.removeChild(elm.parentNode);
        }
    };
    if (location.href.indexOf('www.bing.com') != -1) {
        googleThumbnail.initBing();
    }
    if (location.href.indexOf('www.google.') != -1) {
        googleThumbnail.init();
    }
})();
