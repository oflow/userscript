// ==UserScript==
// @name           Google search thumbnail
// @description    Google検索のサムネを別のやつに変える
// @namespace      http://oflow.me/archives/1066
// @compatibility  Firefox 31-54 (Greasemonkey)
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
// @grant          GM_addStyle
// @grant          GM_xmlhttpRequest
// @version        1.0.20
// @updateURL      https://oflow.me/file/google_search_thumbnail.user.js
// ==/UserScript==

/*
 * 20210601
 *     サムネイル重複
 * 20200722
 *     ズレやすかったGoogleをdisplay: flex;に変更
 *     QwantはCSPで読み込めないから削除
 * 20200611
 *     ニュース検索でのサムネ
 * 20191220
 *     未ログインのとき出てなかった
 * 20191031
 *     AutoPagerizeで動かない場合に対応
 *     混在コンテンツになりそうな画像削除
 *     動画付きの場合に文字が重なっていたので高さ調整
 * 20190912
 *     .g[id^="cs"] の場合がある
 * 20181127
 *     Qwant
 * 20170627
 *     Amazonマーケットプレイスのサムネ取得追加
 * 20161125
 *     add attribute
 * 20160104
 *     fix url
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
        thumbshots: 'https://jp.searchpreview.de/preview?s=%url%&ua=Firefox&ver=830',
        amazon: 'https://images-fe.ssl-images-amazon.com/images/P/%asin%.09._AA120_.jpg',
        youtube: 'https://i.ytimg.com/vi/%id%/default.jpg',
        nicovideo: 'http://tn-skr%number%.smilevideo.jp/smile?i=%id%'
    };

    var regexp = {
        asin: /amazon.+(?:dp|ASIN|gp\/product)\/([0-9A-Z]{10})/,
        nicovideo: /(?:www\.nicovideo\.jp\/watch|nico\.ms|nicoviewer\.net|nicozon\.net\/watch|nicosoku\.com\/watch|nico\.oh-web\.jp)\/sm([0-9]+)/,
        youtube: /www\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_\-]+)/
    };

    var css = '\
        [data-thumbshots] .thumb img {\
            position: absolute;\
        }\
        .g[data-thumbshots] .g .thumb {\
            display: none;\
        }\
        .g[data-thumbshots] {\
            display: flex; \
        }\
        .g[data-thumbshots] .thumb {\
            /*margin-right: 8px; */\
        }\
        .g[data-thumbshots] .thumb img {\
            position: relative;\
        }\
         /* 高さ調整 */\
        [data-thumbshots],\
        [data-thumbshots] > .vsc {\
            min-height: 93px;\
        }\
        [data-thumbshots] > .rc {\
        }\
        /* 画像の枠とかは他のボタンと同じような感じ */\
        [data-thumbshots] .thumb img {\
            width: 111px; height: 82px;\
            display: inline-block;\
            border: 3px solid #f1f1f1; outline: 1px solid #d5d5d5;\
            margin-top: 3px; z-index: 2;\
        }\
        .kno-ahide [data-thumbshots] .thumb,\
        .kno-ahide [data-thumbshots] .thumb img {\
            visibility: hidden;\
        }\
        /* img:hover */\
        [data-thumbshots] .thumb:hover img { outline-color: #c1c1c1; }\
        /* img:active */\
        [data-thumbshots] .thumb:active img { outline-color: #4d90fe; }\
        /* 画像挿入するので位置調整 */\
        [data-thumbshots] > .rc,\
        [data-thumbshots] > div:not([class]),\
        [data-thumbshots] > .vsc,\
        [data-thumbshots] > .ts,\
        [data-thumbshots] > .mbl,\
        [data-thumbshots][data-domain="twitter.com"] > .s,\
        /* section-with-header */\
        [data-thumbshots] > g-section-with-header {\
            margin-left: 12px;\
        }\
        /* bing */\
        [data-thumbshots].b_algo > h2,\
        [data-thumbshots].b_algo > div {\
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
        [data-thumbshots] cite {\
            white-space: nowrap;\
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
        [data-thumbshots][data-thumb-type="video"] { min-height: 132px !important; }\
        [data-thumb-type="video"] .s > div { position: absolute !important; margin-left: 0 !important; }\
        [data-thumb-type="video"] img[class*="vidthumb"] { display: none !important; }\
        /* ～の他の動画≫ */\
        [data-thumb-type="video"] .vsc + div { margin-top: 12px !important; }\
    '.replace(/\s+/g, ' ');

    if (typeof GM_addStyle === 'undefined') {
        var GM_addStyle = function(css) {
            var s = document.createElement('style');
            s.appendChild(document.createTextNode(css));
            document.getElementsByTagName('head')[0].appendChild(s);
        }
    }
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
        qwant: function() {
            GM_addStyle(css);
            document.body.addEventListener('DOMNodeInserted', this, false);
            window.addEventListener('unload', this, false);
            this.checkQwant(document.body);
        },
        handleEvent: function (event) {
            var elm = event.target, i;
            switch (event.type) {
            case 'DOMNodeInserted':
                if (elm.nodeName == 'DIV') {
                    if (elm.getAttribute('data-ved') || elm.querySelector('.g') || elm.className == 'g') {
                        // console.debug(elm);
                        // 2019-10-31 AutoPagerizeで動かなかったので#ires,#rsoあたりはquerySelector('.g')
                        // 2019-09-12 rso
                        // 2012-08-17 ajaxで追加
                        // 2014-10-31 div[data-ved="hogehoge"]になった
                        // 2015-07-24 AutoPagerizeで div.g が追加される
                        this.checkResult(elm);
                    } else if (elm.className.indexOf('result--web') !== -1) {
                        // qwant search
                        this.checkQwant(elm);
                    }
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
//                    this.remove(elm);
                    this.getAmznThumbnail(elm);
                }
                break;
            }
        },
        getAmznThumbnail: function(elm) {
            var href = elm.parentNode.getAttribute('href');
            GM_xmlhttpRequest({method: 'GET', url: href, onload: res => {
                if (res.status !== 200) {
                    elm.parentNode.removeChild(elm);
                } else {
                    if (/-dynamic-image="{&quot;https:\/\/[^\/]+\/images\/I\/([^\.]+)\./i.test(res.responseText)) {
                        elm.src = 'https://images-na.ssl-images-amazon.com/images/I/' + RegExp.$1 + '._AA120_.jpg';
                    } else {
                        elm.parentNode.removeChild(elm);
                    }
                }
            }});
        },
        checkBing: function(elm) {
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
        checkQwant: function(elm) {
            if (elm.nodeName === 'DIV') {
                var a = elm.querySelector('a');
                this.setWebnail(elm, a.href);
            } else {
                var res = document.querySelectorAll('.result--web');
                res.forEach((r) => {
                    var a = r.getElementsByTagName('a')[0];
                    if (a) {
                        this.setWebnail(r, a.href);
                    }
                }, this);
            }
        },
        checkResult: function (elm) {
            var elms = (elm.className == 'g' ? [elm] : elm.getElementsByClassName('g')),
                length = elms.length,
                i, a, href, g, h3, div, domain;
            // div.g > a > img.thumbshots
            // div.g > div.vsc > h3
            for (i = 0; i < length; i += 1) {
                g = elms[i];
                if (h3 = g.querySelector('h3')) {
                    if (a = h3.querySelector('a')) {
                    } else {
                        a = h3.parentNode;
                    }
                } else {
                    a = g.querySelector('a');
                }
                // .g に id, 他のclass が付いてたらたぶん違う
                // #newsbox, #imagebox_bigimages
                if (g.className != 'g') {
                    ['data-ved', 'data-usg', 'data-jsarwt', 'onmousedown'].forEach(d => {
                        if (a.hasAttribute(d)) {
                            a.removeAttribute(d);
                        }
                    });
                    continue;
                }

                if (!a) {
                    continue;
                }
                href = a.href;
                if (href.indexOf('/url') === 0) {
                    href = encodeURIComponent(href.replace(/^.+&url=/, '').replace(/&usg=.+$/, ''));
                }
                ['class', 'data-ved', 'data-usg', 'data-jsarwt', 'onmousedown'].forEach(d => {
                    if (a.hasAttribute(d)) {
                        a.removeAttribute(d);
                    }
                });
                ['data-chref', 'onmousedown'].forEach(d => {
                    a.setAttribute(d, '');
                })

                domain = href.replace(/^https?:\/\//, '').replace(/^([^\/]+).+$/, '$1');
                g.setAttribute('data-domain', domain);
                // ニュース検索したときとか画像が付いてたらやめる
                // ログインしてない場合はfaviconがある
                if (g.querySelector('img') && !a.querySelector('cite')) {
                    continue;
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

                this.setWebnail(g, href);
            }
        },
        setWebnail: function (g, href) {
            var id,
                w   = 'abcdefghijklmnopqrstuvwxyz',
                a   = document.createElement('a'),
                img = document.createElement('img'),
                asin = '';
                
            a.href = href;
            a.className = 'thumb';
            if (regexp.asin.test(href)) {
                // アマゾンっぽかったら商品画像
                //g.className += ' amazon';
                g.setAttribute('data-thumbshots', 'amazon');
                asin = RegExp.$1;
                img.src = url.amazon.replace('%asin%', asin);
                img.setAttribute('data-asin', asin);
                img.addEventListener('load', this, false);
            } else if (regexp.youtube.test(href)) {
                // Youtube
                g.setAttribute('data-thumbshots', 'youtube');
                g.setAttribute('data-thumb-type', 'video');
                img.src = url.youtube.replace('%id%', RegExp.$1);
           } else {
                if (g.getAttribute('style')) {
                    return;
                }
                // 他はサムネ追加
                //href = encodeURIComponent(href);
                href = href.replace(/(https?:\/\/[^\/]+).*$/, '$1');
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
    if (location.href.indexOf('www.qwant.com') != -1) {
        googleThumbnail.qwant();
    }
    if (location.href.indexOf('www.bing.com') != -1) {
        googleThumbnail.initBing();
    }
    if (location.href.indexOf('www.google.') != -1) {
        googleThumbnail.init();
    }
})();


