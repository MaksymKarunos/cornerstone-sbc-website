// Events system for Cornerstone Slavic Bible Church
// Color-coded calendar with recurring events and localStorage sync
(function() {
  var MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MONTHS_SHORT_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  var MONTHS_SHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  var DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var STORAGE_KEY = 'cbc_events';
  var DEFAULT_COLOR = '#5c6bc0';

  function detectLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'ru';
  }

  function formatISO(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function expandRecurring(events, year, month) {
    var expanded = [];
    events.forEach(function(ev) {
      if (ev.recurring === 'weekly' && ev.recurDay !== undefined) {
        var d = new Date(year, month, 1);
        while (d.getMonth() === month) {
          if (d.getDay() === ev.recurDay) {
            expanded.push({
              id: ev.id, date: formatISO(d), time: ev.time, color: ev.color || DEFAULT_COLOR,
              title_ru: ev.title_ru, title_en: ev.title_en,
              desc_ru: ev.desc_ru, desc_en: ev.desc_en, isRecurring: true
            });
          }
          d.setDate(d.getDate() + 1);
        }
      } else if (ev.date) {
        expanded.push(ev);
      }
    });
    return expanded;
  }

  function expandForRange(events, startDate, endDate) {
    var expanded = [];
    events.forEach(function(ev) {
      if (ev.recurring === 'weekly' && ev.recurDay !== undefined) {
        var d = new Date(startDate + 'T00:00:00');
        var end = new Date(endDate + 'T00:00:00');
        while (d <= end) {
          if (d.getDay() === ev.recurDay) {
            expanded.push({
              id: ev.id, date: formatISO(d), time: ev.time, color: ev.color || DEFAULT_COLOR,
              title_ru: ev.title_ru, title_en: ev.title_en,
              desc_ru: ev.desc_ru, desc_en: ev.desc_en, isRecurring: true
            });
          }
          d.setDate(d.getDate() + 1);
        }
      } else if (ev.date >= startDate && ev.date <= endDate) {
        expanded.push(ev);
      }
    });
    return expanded.sort(function(a, b) { return a.date.localeCompare(b.date); });
  }

  function getEventsData(callback) {
    function fromLocal() {
      try {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          var parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) { callback(parsed); return; }
        }
      } catch(e) {}
      var basePath = window.location.pathname.includes('/en/') ? '../data/events.json' : 'data/events.json';
      fetch(basePath).then(function(r) { return r.json(); }).then(callback).catch(function() { callback([]); });
    }

    // Only try API on the Node server (port 4000), skip on static servers to avoid 404 noise
    var port = window.location.port;
    if (port === '4000' || port === '') {
      fetch('/api/events').then(function(r) {
        if (r.ok) return r.json();
        throw new Error('no api');
      }).then(callback).catch(fromLocal);
    } else {
      fromLocal();
    }
  }

  // --- LIST VIEW (homepage) ---
  function renderEventItem(ev, lang) {
    var d = new Date(ev.date + 'T00:00:00');
    var months = lang === 'en' ? MONTHS_SHORT_EN : MONTHS_SHORT_RU;
    var title = lang === 'en' ? ev.title_en : ev.title_ru;
    var desc = lang === 'en' ? ev.desc_en : ev.desc_ru;
    var c = ev.color || DEFAULT_COLOR;
    return '<div class="event-item">' +
      '<div class="event-date" style="border-left: 3px solid ' + c + '"><div class="month">' + months[d.getMonth()] + '</div><div class="day">' + d.getDate() + '</div></div>' +
      '<div class="event-info"><h4>' + title + '</h4><p>' + ev.time + ' — ' + desc + '</p></div>' +
      '</div>';
  }

  function loadEvents(containerId, limit) {
    getEventsData(function(events) {
      var lang = detectLang();
      var today = formatISO(new Date());
      var futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 90);
      var allEvents = expandForRange(events, today, formatISO(futureDate));
      if (limit) allEvents = allEvents.slice(0, limit);
      var container = document.getElementById(containerId);
      if (!container) return;
      if (allEvents.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;">' +
          (lang === 'en' ? 'No upcoming events.' : 'Нет предстоящих событий.') + '</p>';
      } else {
        container.innerHTML = allEvents.map(function(ev) { return renderEventItem(ev, lang); }).join('');
      }
    });
  }

  // --- FILTERED EVENT LIST (for specific pages) ---
  function loadFilteredEvents(containerId, displayTag, limit) {
    getEventsData(function(events) {
      var lang = detectLang();
      var filtered = events.filter(function(e) {
        return e.display && e.display.indexOf(displayTag) !== -1;
      });
      var today = formatISO(new Date());
      var futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 90);
      var allEvents = expandForRange(filtered, today, formatISO(futureDate));
      if (limit) allEvents = allEvents.slice(0, limit);
      var container = document.getElementById(containerId);
      if (!container) return;
      if (allEvents.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;">' +
          (lang === 'en' ? 'No upcoming events.' : 'Нет предстоящих событий.') + '</p>';
      } else {
        container.innerHTML = allEvents.map(function(ev) { return renderEventItem(ev, lang); }).join('');
      }
    });
  }

  // --- SCHEDULE GRID (recurring services rendered as schedule cards) ---
  var DAYS_FULL_RU = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  var DAYS_FULL_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function loadSchedule(containerId) {
    getEventsData(function(events) {
      var lang = detectLang();
      var daysArr = lang === 'en' ? DAYS_FULL_EN : DAYS_FULL_RU;
      var recurring = events.filter(function(e) {
        return e.recurring === 'weekly';
      });
      // Sort by day of week: Sun=0 first
      recurring.sort(function(a, b) { return a.recurDay - b.recurDay; });
      var container = document.getElementById(containerId);
      if (!container || recurring.length === 0) return;
      var html = recurring.map(function(ev) {
        var title = lang === 'en' ? ev.title_en : ev.title_ru;
        var time12 = to12h(ev.time);
        return '<div class="schedule-card">' +
          '<div class="day">' + daysArr[ev.recurDay].toUpperCase() + '</div>' +
          '<div class="time">' + time12 + '</div>' +
          '<div class="desc">' + title + '</div></div>';
      }).join('');
      container.innerHTML = html;
    });
  }

  function to12h(t) {
    var parts = t.split(':');
    var h = parseInt(parts[0]); var m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return h + ':' + m + ' ' + ampm;
  }

  // --- SCHEDULE LIST (for visit/contact pages - simpler format) ---
  function loadScheduleList(containerId) {
    getEventsData(function(events) {
      var lang = detectLang();
      var daysArr = lang === 'en' ? DAYS_FULL_EN : DAYS_FULL_RU;
      var recurring = events.filter(function(e) {
        return e.recurring === 'weekly';
      });
      recurring.sort(function(a, b) { return a.recurDay - b.recurDay; });
      var container = document.getElementById(containerId);
      if (!container || recurring.length === 0) return;
      var html = '<ul style="list-style:none;padding:0;">';
      recurring.forEach(function(ev) {
        var title = lang === 'en' ? ev.title_en : ev.title_ru;
        html += '<li style="padding:8px 0;border-bottom:1px solid #eee;"><strong>' + daysArr[ev.recurDay] + '</strong> — ' + to12h(ev.time) + ' — ' + title + '</li>';
      });
      html += '</ul>';
      container.innerHTML = html;
    });
  }

  // Expose all functions
  window.loadFilteredEvents = loadFilteredEvents;
  window.loadSchedule = loadSchedule;
  window.loadScheduleList = loadScheduleList;

  // --- CALENDAR VIEW ---
  function renderCalendar(calendarId, listId) {
    var lang = detectLang();
    var now = new Date();
    var state = { year: now.getFullYear(), month: now.getMonth(), selectedDate: null };
    getEventsData(function(events) { buildCalendar(calendarId, listId, events, state, lang); });
  }

  function buildCalendar(calendarId, listId, allEvents, state, lang) {
    var container = document.getElementById(calendarId);
    var listContainer = document.getElementById(listId);
    if (!container) return;
    var months = lang === 'en' ? MONTHS_EN : MONTHS_RU;
    var days = lang === 'en' ? DAYS_EN : DAYS_RU;

    function render() {
      var year = state.year, month = state.month;
      var expanded = expandRecurring(allEvents, year, month);
      var eventMap = {};
      expanded.forEach(function(ev) {
        if (!eventMap[ev.date]) eventMap[ev.date] = [];
        eventMap[ev.date].push(ev);
      });

      var firstDay = new Date(year, month, 1).getDay();
      var startOffset = (firstDay + 6) % 7;
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var today = formatISO(new Date());

      var html = '<div class="cal-header">';
      html += '<button class="cal-nav" id="cal-prev">&larr;</button>';
      html += '<span class="cal-title">' + months[month] + ' ' + year + '</span>';
      html += '<button class="cal-nav" id="cal-next">&rarr;</button>';
      html += '</div><div class="cal-grid">';
      days.forEach(function(d) { html += '<div class="cal-day-header">' + d + '</div>'; });
      for (var i = 0; i < startOffset; i++) html += '<div class="cal-cell empty"></div>';

      for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = formatISO(new Date(year, month, d));
        var dayEvents = eventMap[dateStr];
        var hasEvents = dayEvents && dayEvents.length > 0;
        var isToday = dateStr === today;
        var isSelected = dateStr === state.selectedDate;
        var cls = 'cal-cell';
        if (isToday) cls += ' today';
        if (hasEvents) cls += ' has-events';
        if (isSelected) cls += ' selected';

        html += '<div class="' + cls + '" data-date="' + dateStr + '">';
        html += '<span class="cal-day-num">' + d + '</span>';
        if (hasEvents) {
          html += '<div class="cal-dots">';
          var shown = {};
          dayEvents.forEach(function(ev) {
            var c = ev.color || DEFAULT_COLOR;
            if (!shown[c]) {
              html += '<span class="cal-dot" style="background:' + c + '"></span>';
              shown[c] = true;
            }
          });
          html += '</div>';
        }
        html += '</div>';
      }
      html += '</div>';

      // Legend
      var legendColors = {};
      allEvents.forEach(function(ev) {
        var label = lang === 'en' ? ev.title_en : ev.title_ru;
        var c = ev.color || DEFAULT_COLOR;
        if (!legendColors[c]) legendColors[c] = label;
      });
      html += '<div class="cal-legend">';
      Object.keys(legendColors).forEach(function(c) {
        html += '<span class="cal-legend-item"><span class="cal-legend-dot" style="background:' + c + '"></span>' + legendColors[c] + '</span>';
      });
      html += '</div>';

      container.innerHTML = html;

      var showDate = state.selectedDate || today;
      renderDayEvents(listContainer, eventMap[showDate] || [], lang, showDate);

      document.getElementById('cal-prev').addEventListener('click', function() {
        state.month--; if (state.month < 0) { state.month = 11; state.year--; }
        state.selectedDate = null; render();
      });
      document.getElementById('cal-next').addEventListener('click', function() {
        state.month++; if (state.month > 11) { state.month = 0; state.year++; }
        state.selectedDate = null; render();
      });
      container.querySelectorAll('.cal-cell:not(.empty)').forEach(function(cell) {
        cell.addEventListener('click', function() {
          state.selectedDate = this.getAttribute('data-date'); render();
        });
      });
    }
    render();
  }

  function renderDayEvents(container, events, lang, dateStr) {
    if (!container) return;
    var d = new Date(dateStr + 'T00:00:00');
    var months = lang === 'en' ? MONTHS_EN : MONTHS_RU;
    var header = '<h3 class="cal-events-title">' + d.getDate() + ' ' + months[d.getMonth()] + '</h3>';
    if (events.length === 0) {
      container.innerHTML = header + '<p class="cal-no-events">' +
        (lang === 'en' ? 'No events on this day.' : 'Нет событий на этот день.') + '</p>';
      return;
    }
    var html = header;
    events.forEach(function(ev) {
      var title = lang === 'en' ? ev.title_en : ev.title_ru;
      var desc = lang === 'en' ? ev.desc_en : ev.desc_ru;
      var c = ev.color || DEFAULT_COLOR;
      html += '<div class="cal-event-card" style="border-left: 3px solid ' + c + '">';
      html += '<div class="cal-event-time" style="color:' + c + '">' + ev.time + '</div>';
      html += '<div class="cal-event-detail"><strong>' + title + '</strong>';
      if (desc) html += '<br><span class="cal-event-desc">' + desc + '</span>';
      if (ev.isRecurring) html += '<span class="cal-recurring-badge">' + (lang === 'en' ? 'Weekly' : 'Еженедельно') + '</span>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  window.loadEvents = loadEvents;
  window.renderCalendar = renderCalendar;
  window.CBC_STORAGE_KEY = STORAGE_KEY;
})();
