(function () {
function escapeHtml(string) {
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
  };

  return String(string).replace(/[&<>"'/]/g, function (s) { return entityMap[s]; })
}

/**
 * 
 copy from https://github.com/stiang/remove-markdown/index.js
 */
function removeMarkdown(md, options) {
  options = options || {};
  options.listUnicodeChar = options.hasOwnProperty('listUnicodeChar') ? options.listUnicodeChar : false;
  options.stripListLeaders = options.hasOwnProperty('stripListLeaders') ? options.stripListLeaders : true;
  options.gfm = options.hasOwnProperty('gfm') ? options.gfm : true;
  options.useImgAltText = options.hasOwnProperty('useImgAltText') ? options.useImgAltText : true;

  var output = md || '';

  // Remove horizontal rules (stripListHeaders conflict with this rule, which is why it has been moved to the top)
  output = String(output).replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, '');

  try {
    if (options.stripListLeaders) {
      if (options.listUnicodeChar)
        output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, options.listUnicodeChar + ' $1');
      else
        output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, '$1');
    }
    if (options.gfm) {
      output = output
        // Header
        .replace(/\n={2,}/g, '\n')
        // Fenced codeblocks
        .replace(/~{3}.*\n/g, '')
        // Strikethrough
        .replace(/~~/g, '')
        // Fenced codeblocks
        .replace(/`{3}.*\n/g, '');
    }
    output = output
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove setext-style headers
      .replace(/^[=\-]{2,}\s*$/g, '')
      // Remove footnotes?
      .replace(/\[\^.+?\](\: .*?$)?/g, '')
      .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
      // Remove images
      .replace(/\!\[(.*?)\][\[\(].*?[\]\)]/g, options.useImgAltText ? '$1' : '')
      // Remove inline links
      .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
      // Remove blockquotes
      .replace(/^\s{0,3}>\s?/g, '')
      // Remove reference-style links?
      .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
      // Remove atx-style headers
      .replace(/^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$/gm, '$1$2$3')
      // Remove emphasis (repeat the line to remove double emphasis)
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
      // Remove code blocks
      .replace(/(`{3,})(.*?)\1/gm, '$2')
      // Remove inline code
      .replace(/`(.+?)`/g, '$1')
      // Replace two or more newlines with exactly two? Not entirely sure this belongs here...
      .replace(/\n{2,}/g, '\n\n');
  } catch(e) {
    console.error(e);
    return String(md);
  }
  return output;
}

/**
 * @param {String} query
 * @returns {Array}
 */
function search(query) {
  return fetch('/docs/search', {
    method: 'POST',
    headers:{
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: query.trim()
    })
  }).then(
    function (res) { return res.json(); }
  ).then(
    function (results) { return results.map(function (x) {
      var res = {
        id: x.id,
        title: [],
        content: [],
        subheader: [],
        url: '#/' + x.id
      };

      if (x.title.positions.length == 0 && x.subheader.text.length != 0) {
        x.title = x.subheader
        var start = 0;
        var offset = x.subheader.text.length;
        if (x.subheader.positions.length != 0) {
          start = x.subheader.positions[0].start;
          offset = x.subheader.positions[0].offset;
        }
        var subTitle = removeMarkdown(escapeHtml(x.subheader.text.slice(start, start + offset)))
        .trim()
        .toLowerCase()
        .replace(/([.,\/#!?$%\^&\*;:{}=\-_`~()\]\[])+$/g, "") // remove punctuation in the end.
        .split(/\s+/)
        .join('-'); // use '-' to join words in subtitle
        res.url += `?id=${subTitle}`;
      }
      ['title', 'content'].forEach(function (key) {
        var text = x[key].text;
        var cur = 0;
        x[key].positions.forEach(function (pos) {
          res[key].push(removeMarkdown(escapeHtml(text.slice(cur, pos.start))));
          res[key].push(("<em class=\"search-keyword\"> " + (removeMarkdown(escapeHtml(text.slice(pos.start, pos.start + pos.offset)))) + "</em>"));
          cur = pos.start + pos.offset;
        });
        res[key].push(removeMarkdown(escapeHtml(text.slice(cur, text.length))));
        res[key] = res[key].join('');
      });
      return res;
    }); }
  );
}

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties(Constructor.prototype, protoProps); } if (staticProps) { defineProperties(Constructor, staticProps); } return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Tweezer = function () {
  function Tweezer() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Tweezer);

    this.duration = opts.duration || 1000;
    this.ease = opts.easing || this._defaultEase;
    this.start = opts.start;
    this.end = opts.end;

    this.frame = null;
    this.next = null;
    this.isRunning = false;
    this.events = {};
    this.direction = this.start < this.end ? 'up' : 'down';
  }

  _createClass(Tweezer, [{
    key: 'begin',
    value: function begin() {
      if (!this.isRunning && this.next !== this.end) {
        this.frame = window.requestAnimationFrame(this._tick.bind(this));
      }
      return this;
    }
  }, {
    key: 'stop',
    value: function stop() {
      window.cancelAnimationFrame(this.frame);
      this.isRunning = false;
      this.frame = null;
      this.timeStart = null;
      this.next = null;
      return this;
    }
  }, {
    key: 'on',
    value: function on(name, handler) {
      this.events[name] = this.events[name] || [];
      this.events[name].push(handler);
      return this;
    }
  }, {
    key: 'emit',
    value: function emit(name, val) {
      var _this = this;

      var e = this.events[name];
      e && e.forEach(function (handler) {
        return handler.call(_this, val);
      });
    }
  }, {
    key: '_tick',
    value: function _tick(currentTime) {
      this.isRunning = true;

      var lastTick = this.next || this.start;

      if (!this.timeStart) { this.timeStart = currentTime; }
      this.timeElapsed = currentTime - this.timeStart;
      this.next = Math.round(this.ease(this.timeElapsed, this.start, this.end - this.start, this.duration));

      if (this._shouldTick(lastTick)) {
        this.emit('tick', this.next);
        this.frame = window.requestAnimationFrame(this._tick.bind(this));
      } else {
        this.emit('tick', this.end);
        this.emit('done', null);
      }
    }
  }, {
    key: '_shouldTick',
    value: function _shouldTick(lastTick) {
      return {
        up: this.next < this.end && lastTick <= this.next,
        down: this.next > this.end && lastTick >= this.next
      }[this.direction];
    }
  }, {
    key: '_defaultEase',
    value: function _defaultEase(t, b, c, d) {
      if ((t /= d / 2) < 1) { return c / 2 * t * t + b; }
      return -c / 2 * (--t * (t - 2) - 1) + b;
    }
  }]);

  return Tweezer;
}();

var NO_DATA_TEXT = '';

function style() {
  var code = "\n.sidebar {\n  padding-top: 0;\n}\n\n.search {\n  padding: 0 6px 6px 6px;\n  border-bottom: 1px solid #eee;\n  max-height: 60%;\n  overflow-y: auto;\n  flex: none;\n}\n\n.search .input-wrap {\n  padding: 6px 0;\n  position:sticky;\n  top: 0;\n  display: flex;\n  align-items: center;\n}\n\n.search .results-panel {\n  display: none;\n}\n\n.search .results-panel.show {\n  display: block;\n}\n\n.search input {\n  outline: none;\n  border: none;\n  width: 100%;\n  padding: 0 7px;\n  line-height: 36px;\n  font-size: 14px;\n}\n\n.search input::-webkit-search-decoration,\n.search input::-webkit-search-cancel-button,\n.search input {\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  appearance: none;\n}\n.search .clear-button {\n  width: 36px;\n  text-align: right;\n  display: none;\n}\n\n.search .clear-button.show {\n  display: block;\n}\n\n.search .clear-button svg {\n  transform: scale(.5);\n}\n\n.search h2 {\n  font-size: 17px;\n  margin: 10px 0;\n}\n\n.search a {\n  text-decoration: none;\n  color: inherit;\n}\n\n.search .matching-post {\n  border-bottom: 1px solid #eee;\n}\n\n.search .matching-post:last-child {\n  border-bottom: 0;\n}\n\n.search p {\n  font-size: 14px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n}\n\n.search p.empty {\n  text-align: center;\n}";

  Docsify.dom.style(code);
}


var scroller = null;

function scrollTo(el) {
  if (scroller) {
    scroller.stop();
  }
  var sidebar = Docsify.dom.find('.sidebar');
  var wrap = Docsify.dom.find(sidebar, '.sidebar-nav');
  var height = wrap.clientHeight;
  var curOffset = 0;
  var cur = el.offsetTop + el.clientHeight;
  var isInView = el.offsetTop >= wrap.scrollTop && cur <= wrap.scrollTop + height;
  var notThan = cur - curOffset < height;
  var top = isInView ? wrap.scrollTop : notThan ? curOffset : cur - height;

  scroller = new Tweezer({
    start: wrap.scrollTop,
    end: top,
    duration: 500
  })
    .on('tick', function (v) { return wrap.scrollTop = v; })
    .on('done', function () {
      enableScrollEvent = true;
      scroller = null;
    })
    .begin();
}

function tpl(opts, defaultValue) {
  if ( defaultValue === void 0 ) defaultValue = '';

  var html =
    "<div class=\"input-wrap\">\n      <input type=\"search\" value=\"" + defaultValue + "\" />\n      <div class=\"clear-button\">\n        <svg width=\"26\" height=\"24\">\n          <circle cx=\"12\" cy=\"12\" r=\"11\" fill=\"#ccc\" />\n          <path stroke=\"white\" stroke-width=\"2\" d=\"M8.25,8.25,15.75,15.75\" />\n          <path stroke=\"white\" stroke-width=\"2\"d=\"M8.25,15.75,15.75,8.25\" />\n        </svg>\n      </div>\n    </div>\n    <div class=\"results-panel\"></div>\n    </div>";
  var el = Docsify.dom.create('div', html);
  var aside = Docsify.dom.find('aside');

  Docsify.dom.toggleClass(el, 'search');
  Docsify.dom.before(aside, el);
}

function doSearch(value) {
  var $search = Docsify.dom.find('div.search');
  var $panel = Docsify.dom.find($search, '.results-panel');
  var $clearBtn = Docsify.dom.find($search, '.clear-button');
  var sidebar = Docsify.dom.find('.sidebar');

  if (!value) {
    $panel.classList.remove('show');
    $clearBtn.classList.remove('show');
    $panel.innerHTML = '';
    var active = Docsify.dom.find(sidebar, '.active');
    active && scrollTo(active);
    return
  }
  Docsify.dom.body.classList.remove('close');
  search(value).then(
    function (matches) {
      var html = '';
      matches.forEach(function (post) {
        html += "<div class=\"matching-post\">\n<a href=\"" + (post.url) + "\">\n<h2>" + (post.title) + "</h2>\n<div style=\"font-size: 12px; word-break: break-all\">" + (post.id) + "</div>\n<p style=\"margin: 10px 0\">" + (post.content) + "</p>\n</a>\n</div>";
      });
    
      $panel.classList.add('show');
      $clearBtn.classList.add('show');
      $panel.innerHTML = html || ("<p class=\"empty\">" + NO_DATA_TEXT + "</p>");

      //highlight the search result item which was clicked
      var $matchings = Docsify.dom.findAll($panel, '.matching-post');
      $matchings.forEach(function (match_div) {
        Docsify.dom.on(
          match_div,
          'click',
          function(e) {
            var $highlight_serach_css_class = 'highlight-click-search';
            if (!e.currentTarget.classList.contains($highlight_serach_css_class)) {
              $matchings.forEach(function (match) {
                match.classList.remove($highlight_serach_css_class);
              });
              e.currentTarget.classList.add($highlight_serach_css_class);
            }
          }
        );
      });

      //select default: fire click on the first search result item
      if ($matchings.length > 0) {
        var $first_match = $matchings[0];
        var $link = Docsify.dom.find($first_match, 'a');
        if ($link) {
          $link.click();
        }
      }
    }
  );  
}

function bindEvents() {
  var $search = Docsify.dom.find('div.search');
  var $input = Docsify.dom.find($search, 'input');
  var $inputWrap = Docsify.dom.find($search, '.input-wrap');

  var timeId;
  // Prevent to Fold sidebar
  Docsify.dom.on(
    $search,
    'click',
    function (e) { return e.target.tagName !== 'A' && e.stopPropagation(); }
  );
  Docsify.dom.on($input, 'input', function (e) {
    clearTimeout(timeId);
    timeId = setTimeout(function (_) { return doSearch(e.target.value.trim()); }, 100);
  });
  Docsify.dom.on($inputWrap, 'click', function (e) {
    // Click input outside
    if (e.target.tagName !== 'INPUT') {
      $input.value = '';
      doSearch();
    }
  });
  window.addEventListener('message', function (event) {
    var data = event.data;
    switch (data.command) {
      case 'vscodeai-doc-search':
        doSearch(data.keyword);
        $input.value = data.keyword;
        break;
    }
  });
}

function updatePlaceholder(text, path) {
  var $input = Docsify.dom.getNode('.search input[type="search"]');

  if (!$input) {
    return
  }
  if (typeof text === 'string') {
    $input.placeholder = text;
  } else {
    var match = Object.keys(text).filter(function (key) { return path.indexOf(key) > -1; })[0];
    $input.placeholder = text[match];
  }
}

function updateNoData(text, path) {
  if (typeof text === 'string') {
    NO_DATA_TEXT = text;
  } else {
    var match = Object.keys(text).filter(function (key) { return path.indexOf(key) > -1; })[0];
    NO_DATA_TEXT = text[match];
  }
}

function init(opts, vm) {
  var keywords = vm.router.parse().query.s;

  style();
  tpl(opts, keywords);
  bindEvents();
  keywords && setTimeout(function (_) { return doSearch(keywords); }, 500);
}

function update(opts, vm) {
  updatePlaceholder(opts.placeholder, vm.route.path);
  updateNoData(opts.noData, vm.route.path);
}

var CONFIG = {
  placeholder: 'Type to search',
  noData: 'No Results!'
};

var install = function (hook, vm) {
  var opts = vm.config.search || CONFIG;

  if (Array.isArray(opts)) {
  } else if (typeof opts === 'object') {
    CONFIG.placeholder = opts.placeholder || CONFIG.placeholder;
    CONFIG.noData = opts.noData || CONFIG.noData;
  }

  hook.mounted(function (_) {
    init(CONFIG, vm);
  });
  hook.doneEach(function (_) {
    update(CONFIG, vm);
  });
};

$docsify.plugins = [].concat(install, $docsify.plugins);

}());
