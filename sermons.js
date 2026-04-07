// Dynamic sermon archive from YouTube channel
// Fetches videos via a CORS proxy for the YouTube RSS feed
(function() {
  var CHANNEL_ID = 'UC5Of8dh2Wrg8pmXD5TA4tAQ';
  var FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;
  var PROXIES = [
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(FEED_URL),
    'https://corsproxy.io/?' + encodeURIComponent(FEED_URL)
  ];
  var STORAGE_KEY = 'cbc_sermons_cache';
  var CACHE_HOURS = 4;

  // Fallback videos scraped from channel (updated periodically)
  var FALLBACK_VIDEOS = [
    {id:'cHWRslHe8rs',title:'Sunday Worship Service',date:'2025-03-16T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/cHWRslHe8rs/mqdefault.jpg'},
    {id:'cylkI6oGFWk',title:'Sunday Worship Service',date:'2025-03-09T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/cylkI6oGFWk/mqdefault.jpg'},
    {id:'AmoIFOzPjn8',title:'Sunday Worship Service',date:'2025-03-02T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/AmoIFOzPjn8/mqdefault.jpg'},
    {id:'bWidiZqGAX8',title:'Sunday Worship Service',date:'2025-02-23T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/bWidiZqGAX8/mqdefault.jpg'},
    {id:'ZoHNyw3OWjs',title:'Sunday Worship Service',date:'2025-02-16T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/ZoHNyw3OWjs/mqdefault.jpg'},
    {id:'XaFeN0W1Omg',title:'Sunday Worship Service',date:'2025-02-09T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/XaFeN0W1Omg/mqdefault.jpg'},
    {id:'F_QhQbZInVw',title:'Sunday Worship Service',date:'2025-02-02T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/F_QhQbZInVw/mqdefault.jpg'},
    {id:'WS_-89X_J_g',title:'Sunday Worship Service',date:'2025-01-26T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/WS_-89X_J_g/mqdefault.jpg'},
    {id:'9d7LrxwwoZ4',title:'Sunday Worship Service',date:'2025-01-19T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/9d7LrxwwoZ4/mqdefault.jpg'},
    {id:'ZnjMxnqSd5c',title:'Sunday Worship Service',date:'2025-01-12T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/ZnjMxnqSd5c/mqdefault.jpg'},
    {id:'I-Q7dM1MHAo',title:'Sunday Worship Service',date:'2025-01-05T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/I-Q7dM1MHAo/mqdefault.jpg'},
    {id:'Ol1RArDFqg4',title:'Sunday Worship Service',date:'2024-12-29T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/Ol1RArDFqg4/mqdefault.jpg'},
    {id:'P59Xo_z6Rtk',title:'Christmas Service',date:'2024-12-25T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/P59Xo_z6Rtk/mqdefault.jpg'},
    {id:'YGf6d3BZGFw',title:'Sunday Worship Service',date:'2024-12-22T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/YGf6d3BZGFw/mqdefault.jpg'},
    {id:'WgjU9hmOV-Q',title:'Sunday Worship Service',date:'2024-12-15T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/WgjU9hmOV-Q/mqdefault.jpg'},
    {id:'XJyHLTlTl9o',title:'Sunday Worship Service',date:'2024-12-08T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/XJyHLTlTl9o/mqdefault.jpg'},
    {id:'4l-XvbknwDs',title:'Sunday Worship Service',date:'2024-12-01T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/4l-XvbknwDs/mqdefault.jpg'},
    {id:'1ZKu97IewLs',title:'Sunday Worship Service',date:'2024-11-24T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/1ZKu97IewLs/mqdefault.jpg'},
    {id:'ZOoOdRSQlRo',title:'Sunday Worship Service',date:'2024-11-17T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/ZOoOdRSQlRo/mqdefault.jpg'},
    {id:'YP-eB9C8N90',title:'Sunday Worship Service',date:'2024-11-10T00:00:00Z',description:'',thumbnail:'https://i.ytimg.com/vi/YP-eB9C8N90/mqdefault.jpg'}
  ];

  function detectLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'ru';
  }

  function formatDate(dateStr, lang) {
    var d = new Date(dateStr);
    if (lang === 'ru') {
      var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function parseRSS(xml) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, 'text/xml');
    var entries = doc.querySelectorAll('entry');
    var videos = [];
    entries.forEach(function(entry) {
      var videoId = '';
      var vidEl = entry.querySelector('videoId');
      if (vidEl) videoId = vidEl.textContent;
      var title = entry.querySelector('title') ? entry.querySelector('title').textContent : '';
      var published = entry.querySelector('published') ? entry.querySelector('published').textContent : '';
      var desc = '';
      var mediaGroup = entry.getElementsByTagName('media:group')[0];
      if (mediaGroup) {
        var mediaDesc = mediaGroup.getElementsByTagName('media:description')[0];
        if (mediaDesc) desc = mediaDesc.textContent;
      }
      if (videoId) {
        videos.push({
          id: videoId,
          title: title,
          date: published,
          description: desc.substring(0, 200),
          thumbnail: 'https://i.ytimg.com/vi/' + videoId + '/mqdefault.jpg'
        });
      }
    });
    return videos;
  }

  function getCached() {
    try {
      var cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        var data = JSON.parse(cached);
        var age = (Date.now() - data.timestamp) / (1000 * 60 * 60);
        if (age < CACHE_HOURS && data.videos && data.videos.length > 0) {
          return data.videos;
        }
      }
    } catch(e) {}
    return null;
  }

  function setCache(videos) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), videos: videos }));
    } catch(e) {}
  }

  function renderSermons(containerId, videos, limit) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var lang = detectLang();
    var items = limit ? videos.slice(0, limit) : videos;

    if (items.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;">' +
        (lang === 'en' ? 'No sermons found.' : 'Проповеди не найдены.') + '</p>';
      return;
    }

    var html = items.map(function(v) {
      return '<div class="sermon-card">' +
        '<a href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener" class="sermon-thumb">' +
        '<img src="' + v.thumbnail + '" alt="' + v.title.replace(/"/g, '&quot;') + '" loading="lazy">' +
        '<div class="sermon-play"></div>' +
        '</a>' +
        '<div class="sermon-info">' +
        '<div class="sermon-date">' + formatDate(v.date, lang) + '</div>' +
        '<h3 class="sermon-title"><a href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener">' + v.title + '</a></h3>' +
        (v.description ? '<p class="sermon-desc">' + v.description + '</p>' : '') +
        '</div></div>';
    }).join('');

    container.innerHTML = html;
  }

  function tryFetch(urls, index) {
    if (index >= urls.length) return Promise.reject();
    return fetch(urls[index])
      .then(function(r) { if (!r.ok) throw new Error(); return r.text(); })
      .then(function(xml) {
        var videos = parseRSS(xml);
        if (videos.length > 0) return videos;
        throw new Error('empty');
      })
      .catch(function() { return tryFetch(urls, index + 1); });
  }

  function loadSermons(containerId, limit) {
    var cached = getCached();
    if (cached) {
      renderSermons(containerId, cached, limit);
      return;
    }

    var container = document.getElementById(containerId);
    if (container) {
      var lang = detectLang();
      container.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">' +
        (lang === 'en' ? 'Loading sermons...' : 'Загрузка проповедей...') + '</p>';
    }

    tryFetch(PROXIES, 0)
      .then(function(videos) {
        setCache(videos);
        renderSermons(containerId, videos, limit);
      })
      .catch(function() {
        // Use hardcoded fallback videos
        renderSermons(containerId, FALLBACK_VIDEOS, limit);
      });
  }

  window.loadSermons = loadSermons;
})();
