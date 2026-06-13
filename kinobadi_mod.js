(function () {
    'use strict';

    if (window.KinobadiMiniPlugin) return;
    window.KinobadiMiniPlugin = true;

    var base = 'https://ma.kinobadi.im';

    function abs(url) {
        if (!url) return '';
        if (url.indexOf('//') === 0) return 'https:' + url;
        if (url.indexOf('/') === 0) return base + url;
        return url;
    }

    function get(url, success, fail) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            if (xhr.status >= 200 && xhr.status < 400) success(xhr.responseText);
            else if (fail) fail(xhr.status);
        };
        xhr.send();
    }

    function textBetween(html, a, b) {
        var i = html.indexOf(a);
        if (i === -1) return '';
        i += a.length;
        var j = html.indexOf(b, i);
        if (j === -1) return '';
        return html.slice(i, j).trim();
    }

    function parseCatalog(html) {
        var items = [];
        var seen = {};

        var re = /<a[^>]+href="([^"]*/film/[^"]+)"[^>]*>([sS]*?)</a>/gi;
        var m;

        while ((m = re.exec(html)) !== null) {
            var url = abs(m[1]);
            if (seen[url]) continue;
            seen[url] = true;

            var block = m[2];

            var title =
                (block.match(/title="([^"]+)"/i) || [])[1] ||
                (block.match(/alt="([^"]+)"/i) || [])[1] ||
                textBetween(block, '>', '<');

            var poster =
                (block.match(/data-src="([^"]+)"/i) || [])[1] ||
                (block.match(/src="([^"]+)"/i) || [])[1] ||
                '';

            title = (title || '').replace(/s+/g, ' ').trim();
            poster = abs(poster);

            if (!title) continue;

            items.push({
                title: title,
                url: url,
                poster: poster,
                subtitle: '',
                description: ''
            });
        }

        return items;
    }

    function showMessage(title, body) {
        if (window.Lampa && Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show(title + (body ? ('
' + body) : ''));
        } else if (window.alert) {
            alert(title + (body ? ('
' + body) : ''));
        }
    }

    function openFilmPage(item) {
        get(item.url, function (html) {
            var title =
                (html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) || [])[1] ||
                item.title;

            var desc =
                (html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) || [])[1] ||
                textBetween(html, '<div class="description">', '</div>');

            var poster =
                (html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) || [])[1] ||
                item.poster;

            var msg = [
                title,
                '',
                desc || 'Описание не найдено',
                '',
                item.url
            ].join('
');

            showMessage('Kinobadi', msg);
        }, function () {
            showMessage('Kinobadi', 'Не удалось открыть страницу фильма');
        });
    }

    function loadCatalog() {
        get(base, function (html) {
            var items = parseCatalog(html);

            if (!items.length) {
                showMessage('Kinobadi', 'Карточки не найдены на главной странице');
                return;
            }

            var list = items.slice(0, 30).map(function (it, i) {
                return (i + 1) + '. ' + it.title + '
' + it.url;
            }).join('

');

            showMessage('Kinobadi каталог', 'Найдено карточек: ' + items.length + '

' + list);
        }, function () {
            showMessage('Kinobadi', 'Ошибка загрузки каталога');
        });
    }

    function injectMenu() {
        var btn = document.createElement('div');
        btn.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;background:#2d89ef;color:#fff;padding:12px 16px;border-radius:10px;font-size:14px;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,.25);';
        btn.textContent = 'Kinobadi';
        btn.onclick = loadCatalog;
        document.body.appendChild(btn);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(injectMenu, 500);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(injectMenu, 500);
        });
    }

    window.KinobadiMini = {
        openCatalog: loadCatalog,
        openFilm: openFilmPage,
        parseCatalog: parseCatalog
    };
})();