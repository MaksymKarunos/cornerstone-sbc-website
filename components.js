// Shared header and footer for Cornerstone SBC
// Ensures consistent navigation across all pages
(function() {
  var lang = document.documentElement.lang === 'ru' ? 'ru' : 'en';
  var isSubdir = window.location.pathname.includes('/ru/');
  var prefix = isSubdir ? '../' : '';
  var langPrefix = isSubdir ? '' : 'ru/';
  var currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

  function active(page) { return currentPage === page ? ' class="active"' : ''; }
  function langHref(page) { return isSubdir ? prefix + page + '.html' : langPrefix + page + '.html'; }
  function href(page) { return page + '.html'; }

  var NAV = {
    en: {
      home: 'Home', about: 'About Us', ministries: 'Ministries',
      media: 'Media', livestream: 'Livestream', events: 'Events', sermons: 'Sermons',
      giving: 'Giving', contact: 'Contact', visit: 'Plan Your Visit?',
      langLabel: 'RU', menuLabel: 'Menu'
    },
    ru: {
      home: 'Главная', about: 'О нас', ministries: 'Служения',
      media: 'Медиа', livestream: 'Прямая трансляция', events: 'События', sermons: 'Проповеди',
      giving: 'Пожертвования', contact: 'Контакты', visit: 'Планируете посетить?',
      langLabel: 'EN', menuLabel: 'Меню'
    }
  };

  var FOOTER = {
    en: {
      desc: 'Cornerstone Slavic Bible Church. Worship, discipleship, mission.',
      pages: 'Pages', forVisitors: 'For Visitors', contactTitle: 'Contact',
      home: 'Home', about: 'About', ministries: 'Ministries', events: 'Events',
      visit: 'Plan Your Visit', faq: 'FAQ', livestream: 'Livestream', giving: 'Giving', contact: 'Contact',
      copyright: 'Cornerstone Slavic Bible Church. All rights reserved.'
    },
    ru: {
      desc: 'Славянская Библейская Церковь — Краеугольный Камень.',
      pages: 'Страницы', forVisitors: 'Для посетителей', contactTitle: 'Контакты',
      home: 'Главная', about: 'О церкви', ministries: 'Служения', events: 'События',
      visit: 'Планируете посетить?', faq: 'Частые вопросы', livestream: 'Трансляция', giving: 'Пожертвования', contact: 'Контакты',
      copyright: 'Славянская Библейская Церковь — Краеугольный Камень. Все права защищены.'
    }
  };

  var n = NAV[lang];
  var f = FOOTER[lang];
  var logoSrc = prefix + 'images/cornerstone_slavic_bible_church_logo.svg';

  // Build header
  var headerHTML =
    '<div class="header-inner">' +
      '<a href="' + href('index') + '" class="logo"><img src="' + logoSrc + '" alt="Cornerstone SBC" class="logo-img"></a>' +
      '<button class="mobile-toggle" onclick="document.querySelector(\'.main-nav\').classList.toggle(\'open\')" aria-label="' + n.menuLabel + '">&#9776;</button>' +
      '<nav class="main-nav">' +
        '<a href="' + href('index') + '"' + active('index') + '>' + n.home + '</a>' +
        '<a href="' + href('about') + '"' + active('about') + '>' + n.about + '</a>' +
        '<a href="' + href('ministries') + '"' + active('ministries') + '>' + n.ministries + '</a>' +
        '<div class="dropdown"><span class="nav-link">' + n.media + ' &#9662;</span><div class="dropdown-menu">' +
          '<a href="' + href('livestream') + '"' + active('livestream') + '>' + n.livestream + '</a>' +
          '<a href="' + href('events') + '"' + active('events') + '>' + n.events + '</a>' +
          '<a href="' + href('sermons') + '"' + active('sermons') + '>' + n.sermons + '</a>' +
        '</div></div>' +
        '<a href="' + href('donate') + '"' + active('donate') + '>' + n.giving + '</a>' +
        '<a href="' + href('contact') + '"' + active('contact') + '>' + n.contact + '</a>' +
        '<a href="' + href('visit') + '" class="nav-cta">' + n.visit + '</a>' +
        '<a href="' + langHref(currentPage) + '" class="lang-switch">' + n.langLabel + '</a>' +
      '</nav>' +
    '</div>';

  // Build footer
  var year = new Date().getFullYear();
  var ytLink = 'https://www.youtube.com/@SlavicBaptistChurchBellingham';
  var footerHTML =
    '<div class="container"><div class="footer-grid">' +
      '<div class="footer-about"><a href="' + href('index') + '" class="logo"><img src="' + logoSrc + '" alt="Cornerstone SBC" class="logo-img"></a>' +
        '<p>' + f.desc + '</p>' +
        '<div class="social-links"><a href="' + ytLink + '" class="social-link" title="YouTube" target="_blank" rel="noopener">YT</a><a href="#" class="social-link" title="Facebook">FB</a><a href="#" class="social-link" title="Instagram">IG</a></div></div>' +
      '<div class="footer-section"><h4>' + f.pages + '</h4><ul>' +
        '<li><a href="' + href('index') + '">' + f.home + '</a></li>' +
        '<li><a href="' + href('about') + '">' + f.about + '</a></li>' +
        '<li><a href="' + href('ministries') + '">' + f.ministries + '</a></li>' +
        '<li><a href="' + href('events') + '">' + f.events + '</a></li></ul></div>' +
      '<div class="footer-section"><h4>' + f.forVisitors + '</h4><ul>' +
        '<li><a href="' + href('visit') + '">' + f.visit + '</a></li>' +
        '<li><a href="' + href('faq') + '">' + f.faq + '</a></li>' +
        '<li><a href="' + href('livestream') + '">' + f.livestream + '</a></li>' +
        '<li><a href="' + href('donate') + '">' + f.giving + '</a></li>' +
        '<li><a href="' + href('contact') + '">' + f.contact + '</a></li></ul></div>' +
      '<div class="footer-section"><h4>' + f.contactTitle + '</h4><ul>' +
        '<li>1413 Broadway</li><li>Bellingham, WA 98225</li>' +
        '<li>(360) 756-8338</li><li>church@csbchurch.com</li></ul></div>' +
    '</div>' +
    '<div class="footer-bottom"><p>&copy; ' + year + ' ' + f.copyright + '</p></div></div>';

  // Inject
  var header = document.querySelector('.site-header');
  if (header) header.innerHTML = headerHTML;

  var footer = document.querySelector('.site-footer');
  if (footer) footer.innerHTML = footerHTML;
})();
