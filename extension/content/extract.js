// TruthStrike 2.0 — Content Extraction
//
// Finds the units of content worth analyzing: posts on social platforms,
// articles on news sites, comment bodies. Platform-specific selectors first,
// generic article/paragraph clustering as fallback. Returns candidates as
// {element, text, kind} — analysis never touches the DOM directly.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  var MIN_WORDS = 25;

  var PLATFORMS = [
    {
      match: /(^|\.)((twitter|x)\.com)$/,
      name: 'X/Twitter',
      social: true,
      candidates: function () {
        return Array.from(document.querySelectorAll('article[data-testid="tweet"]')).map(function (el) {
          var t = el.querySelector('[data-testid="tweetText"]');
          return { element: el, text: t ? t.innerText : el.innerText, kind: 'post' };
        });
      }
    },
    {
      match: /(^|\.)facebook\.com$/,
      name: 'Facebook',
      social: true,
      candidates: function () {
        return Array.from(document.querySelectorAll('div[role="article"]')).map(function (el) {
          return { element: el, text: el.innerText, kind: 'post' };
        });
      }
    },
    {
      match: /(^|\.)reddit\.com$/,
      name: 'Reddit',
      social: true,
      candidates: function () {
        var out = [];
        document.querySelectorAll('shreddit-post').forEach(function (el) {
          out.push({ element: el, text: el.innerText, kind: 'post' });
        });
        document.querySelectorAll('shreddit-comment').forEach(function (el) {
          out.push({ element: el, text: el.innerText, kind: 'comment' });
        });
        return out;
      }
    },
    {
      match: /(^|\.)(youtube\.com)$/,
      name: 'YouTube',
      social: true,
      candidates: function () {
        var out = [];
        var desc = document.querySelector('#description-inline-expander, ytd-text-inline-expander');
        if (desc) out.push({ element: desc, text: desc.innerText, kind: 'description' });
        document.querySelectorAll('ytd-comment-thread-renderer #content-text').forEach(function (el) {
          out.push({ element: el.closest('ytd-comment-thread-renderer') || el, text: el.innerText, kind: 'comment' });
        });
        return out;
      }
    },
    {
      match: /(^|\.)(truthsocial\.com|gab\.com|gettr\.com)$/,
      name: 'Alt-social',
      social: true,
      candidates: function () {
        return Array.from(document.querySelectorAll('.status, [data-testid="status"], .post')).map(function (el) {
          return { element: el, text: el.innerText, kind: 'post' };
        });
      }
    }
  ];

  function genericCandidates() {
    // News/article pages: prefer <article>; fall back to main content region;
    // last resort, cluster the page's paragraphs as one unit.
    var out = [];
    var articles = document.querySelectorAll('article');
    if (articles.length && articles.length < 30) {
      articles.forEach(function (el) {
        out.push({ element: el, text: el.innerText, kind: 'article' });
      });
      return out;
    }
    var main = document.querySelector('main, [role="main"], #content, .article-body, .story-body');
    if (main) {
      out.push({ element: main, text: main.innerText, kind: 'article' });
      return out;
    }
    var paras = Array.from(document.querySelectorAll('p')).filter(function (p) {
      return (p.innerText || '').split(/\s+/).length > 30;
    });
    if (paras.length >= 3) {
      var container = paras[0].closest('div, section') || document.body;
      out.push({ element: container, text: paras.map(function (p) { return p.innerText; }).join('\n'), kind: 'article' });
    }
    return out;
  }

  TS.extract = {
    platform: function () {
      var h = location.hostname.replace(/^www\./, '');
      for (var i = 0; i < PLATFORMS.length; i++) {
        if (PLATFORMS[i].match.test(h)) return PLATFORMS[i];
      }
      return null;
    },

    isSocial: function () {
      var p = TS.extract.platform();
      return !!(p && p.social);
    },

    candidates: function () {
      var p = TS.extract.platform();
      var list = p ? p.candidates() : genericCandidates();
      return list.filter(function (c) {
        if (!c.element || !c.text) return false;
        var words = c.text.split(/\s+/).length;
        return words >= MIN_WORDS && words <= 12000;
      });
    }
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
