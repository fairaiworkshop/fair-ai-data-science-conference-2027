const C = window.SITE_CONTENT || {};

/* Keep hash navigation aligned directly below the sticky header */
function syncHeaderOffset() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const offset = Math.ceil(header.getBoundingClientRect().height) + 6;
  document.documentElement.style.setProperty('--header-offset', `${offset}px`);
}
syncHeaderOffset();
window.addEventListener('resize', syncHeaderOffset);
window.addEventListener('load', () => {
  syncHeaderOffset();
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
  }
});

const q = (selector, parent = document) => parent.querySelector(selector);
const qa = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const arr = value => Array.isArray(value) ? value : [];

function cycle(callback, delay) {
  let timer = window.setInterval(callback, delay);
  document.addEventListener('visibilitychange', () => {
    window.clearInterval(timer);
    if (!document.hidden) timer = window.setInterval(callback, delay);
  });
  return { restart(){ window.clearInterval(timer); timer = window.setInterval(callback, delay); } };
}

function imageOrInitials(item, className='person-photo') {
  const initials = item.initials || (item.name || '?').split(' ').map(w => w[0]).slice(0,2).join('');
  return item.image
    ? `<img class="${className}" src="${item.image}" alt="${item.name || ''}" loading="lazy" onerror="this.outerHTML='<div class=&quot;avatar blue&quot;>${initials}</div>'">`
    : `<div class="avatar blue">${initials}</div>`;
}

function personCard(person, label) {
  return `<article class="speaker-card person-card reveal">
    ${imageOrInitials(person)}
    <div>
      <span class="person-type">${label}</span>
      <h3>${person.name || ''}</h3>
      ${person.role ? `<p class="role">${person.role}</p>` : ''}
      ${person.institute ? `<p class="meta">${person.institute}</p>` : ''}
      ${person.place ? `<p class="meta">${person.place}</p>` : ''}
      ${person.topic || person.about ? `<p class="topic">${person.topic || person.about}</p>` : ''}
    </div>
  </article>`;
}

function simpleDots(items, active) {
  return arr(items).map((_, i) => `<button type="button" class="${i === active ? 'active' : ''}" data-index="${i}" aria-label="Show item ${i+1}"></button>`).join('');
}

/* Navigation */
q('#main-nav').innerHTML = arr(C.nav).map(([name, href]) => `<a href="${href}">${name}</a>`).join('');
q('#footer-links').innerHTML = arr(C.nav).slice(1).map(([name, href]) => `<a href="${href}">${name}</a>`).join('');
q('#quick-stats').innerHTML = arr(C.stats).map(s => `<div><b>${s.value}</b><span>${s.label}</span></div>`).join('');
q('#year').textContent = new Date().getFullYear();

qa('[data-link]').forEach(a => {
  const link = C.links?.[a.dataset.link];
  if (!link) return;
  a.href = link;
  if (!link.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener'; }
});

/* Latest news flash */
const news = arr(C.news);
const newsBox = q('#latest-news-flash');
let newsIndex = 0;
function renderLatestNews(direction=1) {
  if (!newsBox) return;
  if (!news.length) { newsBox.innerHTML = '<p class="empty-state">Latest updates will be added soon.</p>'; return; }
  const item = news[newsIndex];
  newsBox.innerHTML = `<div class="news-flash-stage ${direction < 0 ? 'from-left' : 'from-top'}">
    <span class="news-flash-tag">${item.tag || 'Update'}</span>
    <h3>${item.title || ''}</h3>
    <p>${item.detail || ''}</p>
  </div>
  <div class="flash-controls">
    <button id="news-prev" aria-label="Previous news">←</button>
    <div class="flash-dots">${simpleDots(news, newsIndex)}</div>
    <button id="news-next" aria-label="Next news">→</button>
  </div>`;
  q('#news-prev')?.addEventListener('click', () => { newsIndex = (newsIndex - 1 + news.length) % news.length; renderLatestNews(-1); newsCycle.restart(); });
  q('#news-next')?.addEventListener('click', () => { newsIndex = (newsIndex + 1) % news.length; renderLatestNews(1); newsCycle.restart(); });
  qa('.flash-dots button', newsBox).forEach(btn => btn.addEventListener('click', () => { newsIndex = Number(btn.dataset.index); renderLatestNews(1); newsCycle.restart(); }));
}
renderLatestNews();
const newsCycle = cycle(() => { newsIndex = (newsIndex + 1) % news.length; renderLatestNews(1); }, 4200);

/* Collaborating institutions flash below Latest News */
const logos = arr(C.logos);
const logoBox = q('#logo-flash');
let logoIndex = 0;
function renderLogoFlash(direction=1) {
  if (!logoBox) return;
  if (!logos.length) { logoBox.innerHTML = '<p class="empty-state">Logos will be added soon.</p>'; return; }
  const item = logos[logoIndex];
  logoBox.innerHTML = `<div class="logo-stage ${direction < 0 ? 'from-left' : 'from-top'}">
    <img src="${item.image}" alt="${item.name}">
    <h3>${item.name}</h3>
    <p>${item.place}</p>
  </div>
  <div class="flash-controls">
    <button id="logo-prev" aria-label="Previous logo">←</button>
    <div class="flash-dots">${simpleDots(logos, logoIndex)}</div>
    <button id="logo-next" aria-label="Next logo">→</button>
  </div>`;
  q('#logo-prev')?.addEventListener('click', () => { logoIndex = (logoIndex - 1 + logos.length) % logos.length; renderLogoFlash(-1); logoCycle.restart(); });
  q('#logo-next')?.addEventListener('click', () => { logoIndex = (logoIndex + 1) % logos.length; renderLogoFlash(1); logoCycle.restart(); });
  qa('.flash-dots button', logoBox).forEach(btn => btn.addEventListener('click', () => { logoIndex = Number(btn.dataset.index); renderLogoFlash(1); logoCycle.restart(); }));
}
renderLogoFlash();
const logoCycle = cycle(() => { logoIndex = (logoIndex + 1) % logos.length; renderLogoFlash(1); }, 3600);

const projectTeam = arr(C.instructors);
const spotlightTeam = projectTeam.filter(p => /Foreign Expert/i.test(p.role || '')).slice(0, 2);

//* Instructor flash strip before workshop focus — foreign experts only */
const instrFlash = q('#instructor-flash');
let flashIndex = 0;

function renderInstructorFlash() {
  if (!instrFlash || !spotlightTeam.length) return;

  const p = spotlightTeam[flashIndex];

  instrFlash.innerHTML = `
    <div class="flash-instructor-card from-top">
      ${imageOrInitials(p, 'flash-instructor-photo')}

      <div>
        <p class="eyebrow">Course instructor spotlight</p>
        <h2>${p.name}</h2>
        <p class="role">${p.role}</p>
      </div>
    </div>
  `;
}

renderInstructorFlash();

cycle(() => {
  flashIndex = (flashIndex + 1) % spotlightTeam.length;
  renderInstructorFlash();
}, 4300);

/* Short Term Course */
q('#course-copy').innerHTML = arr(C.shortTermCourse?.body).map(p => `<p>${p}</p>`).join('');
q('#exposure-grid').innerHTML = arr(C.shortTermCourse?.exposure).map(t => `<article><span>•</span><p>${t}</p></article>`).join('');

/* Instructors and panel */
q('#instructor-grid').innerHTML = projectTeam.map(p => personCard(p, 'Course Expert')).join('');
if (q('#panel-title')) q('#panel-title').textContent = C.panel?.title || 'Panel Discussion';
if (q('#panel-subtitle')) q('#panel-subtitle').textContent = C.panel?.subtitle || '';
if (q('#panel-grid')) q('#panel-grid').innerHTML = arr(C.panel?.speakers).map(p => personCard(p, 'Panel Speaker')).join('');

/* Registration */
q('#registration-summary').textContent = `Who can register: ${C.registration?.who || ''}`;
q('#registration-card').innerHTML = `<div class="registration-copy">
  <span class="status-pill">Applications open</span>
  <h3>${C.registration?.deadline || ''}</h3>
  <ul>${arr(C.registration?.fees).map(f => `<li>${f}</li>`).join('')}</ul>
  <p>${C.registration?.paymentGuidelines || ''}</p>
</div>

<div class="qr-center-wrap" aria-label="Registration and payment QR codes">
  <div class="qr-grid qr-grid-large">
    <figure>
      <a href="${C.links?.payment || '#registration'}" target="_blank" rel="noopener" aria-label="Open payment link">
        <img src="${C.registration?.paymentQr || ''}" alt="Payment QR code">
      </a>
      <figcaption><b>Scan for payment</b><span>or click the QR code</span></figcaption>
    </figure>
    <figure>
      <a href="${C.links?.register || '#'}" target="_blank" rel="noopener" aria-label="Open registration form">
        <img src="${C.registration?.registrationQr || ''}" alt="Registration QR code">
      </a>
      <figcaption><b>Scan for registration</b><span>or click the QR code</span></figcaption>
    </figure>
  </div>
</div>

<div class="registration-action-grid registration-action-grid-bottom">
  <a class="registration-action primary" href="${C.links?.register || '#'}" target="_blank" rel="noopener"><span>1</span><b>Open registration link</b><small>Complete the official workshop registration form</small></a>
  <a class="registration-action" href="${C.links?.paymentSteps || '#'}" target="_blank" rel="noopener"><span>2</span><b>Payment steps PDF</b><small>Open the payment guidelines and fee details</small></a>
  <a class="registration-action" href="${C.links?.payment || '#registration'}" target="_blank" rel="noopener"><span>3</span><b>Pay for registration</b><small>Use the payment QR / approved payment route</small></a>
  <a class="registration-action" href="${C.links?.brochure || '#'}" target="_blank" rel="noopener"><span>4</span><b>Download brochure</b><small>View the latest workshop brochure</small></a>
</div>`;

/* Certificates */
q('#certificate-grid').innerHTML = arr(C.certificates).map(c => `<article class="certificate-card certificate-card-single reveal"><img src="${c.image}" alt="${c.title}"><div><h3>${c.title}</h3><p>${c.description}</p></div></article>`).join('');

/* Call for papers is displayed only on call-for-papers.html */
const cfpDescription = q('#cfp-description');
const cfpCard = q('#cfp-card');
if (cfpDescription) cfpDescription.textContent = C.callForPapers?.description || '';
if (cfpCard) {
  cfpCard.innerHTML = `<div class="cfp-main">
    <p class="mini-label">Theme</p><h3>${C.callForPapers?.theme || ''}</h3>
    <p class="mini-label">Submission topics</p>
    <ul class="topic-list">${arr(C.callForPapers?.topics).map(t => `<li>${t}</li>`).join('')}</ul>
  </div>
  <div class="cfp-dates"><p class="mini-label">Important dates</p>${arr(C.callForPapers?.dates).map(d => `<article><strong>${d.label}</strong><span>${d.value}</span></article>`).join('')}</div>`;
}

const paperCertificate = C.paperCertificate;
const paperCertificateWrap = q('#paper-certificate-wrap');
if (paperCertificateWrap && paperCertificate) {
  paperCertificateWrap.innerHTML = `<div class="paper-certificate-heading"><p class="eyebrow">Paper Presentation Certificate</p><h3>${paperCertificate.title}</h3><p>${paperCertificate.description}</p></div><article class="certificate-card paper-certificate-card"><img src="${paperCertificate.image}" alt="${paperCertificate.title}"><div><h3>${paperCertificate.title}</h3><p>${paperCertificate.description}</p></div></article>`;
}

/* Schedule */
const schedule = arr(C.schedule); let scheduleIndex = 0;
q('#schedule-tabs').innerHTML = schedule.map((d,i) => `<button type="button" data-index="${i}" class="${i===0?'active':''}"><b>${d.day}</b> · ${d.date}</button>`).join('');
function renderSchedule(direction=1) {
  const day = schedule[scheduleIndex];
  qa('#schedule-tabs button').forEach((b,i) => b.classList.toggle('active', i === scheduleIndex));
  q('#schedule-panel').innerHTML = `<div class="schedule-slide ${direction < 0 ? 'from-left' : 'from-top'}">${arr(day?.items).map(([time,title]) => `<article><time>${time}</time><div><h3>${title}</h3><span>${day.theme}</span></div></article>`).join('')}</div><div class="auto-progress"><span></span></div>`;
}
q('#schedule-tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const next = Number(b.dataset.index); const direction = next < scheduleIndex ? -1 : 1; scheduleIndex = next; renderSchedule(direction); scheduleCycle.restart(); });
renderSchedule();
const scheduleCycle = cycle(() => { scheduleIndex = (scheduleIndex + 1) % schedule.length; renderSchedule(); }, 5000);

/* Messages */
const messages = arr(C.messages); let messageIndex = 0;
function renderMessage(direction=1) {
  const m = messages[messageIndex];
  q('#message-card').innerHTML = `<div class="message-slide ${direction < 0 ? 'from-left' : 'from-top'}">
    ${imageOrInitials(m, 'message-photo')}
    <div><h3>${m.title}</h3><p class="name">${m.name}</p><p class="meta">${m.designation || ''}</p></div>
    <blockquote>“${m.text || ''}”</blockquote>
  </div><div class="auto-progress message-progress"><span></span></div>`;
  q('#message-dots').innerHTML = simpleDots(messages, messageIndex);
}
q('#message-prev').onclick = () => { messageIndex = (messageIndex - 1 + messages.length) % messages.length; renderMessage(-1); messageCycle.restart(); };
q('#message-next').onclick = () => { messageIndex = (messageIndex + 1) % messages.length; renderMessage(1); messageCycle.restart(); };
q('#message-dots').onclick = e => { if (!e.target.matches('button')) return; messageIndex = Number(e.target.dataset.index); renderMessage(1); messageCycle.restart(); };
renderMessage();
const messageCycle = cycle(() => { messageIndex = (messageIndex + 1) % messages.length; renderMessage(1); }, 10000);

//* Coordinators */
q('#coordinator-grid').innerHTML = arr(C.coordinators)
  .map(p => personCard(p, ''))
  .join('');
/* Contact */
q('#contact-block').innerHTML = `<div class="contact-info">
  <a href="mailto:${C.contact?.email}"><small>Email</small><b>${C.contact?.email}</b></a>
  <a href="tel:${(C.contact?.phone || '').replace(/\s/g,'')}"><small>Contact number</small><b>${C.contact?.phone}</b><em class="phone-note">Please add +91 before dialing the number.</em></a>
  <a href="${C.contact?.map}" target="_blank" rel="noopener"><small>Venue</small><b>${C.contact?.venue}</b></a>
</div>
<div class="contact-images"><img src="${C.contact?.venueImage}" alt="Venue"><img src="${C.contact?.mapImage}" alt="Venue map"></div>`;

/* Mobile navigation */
const nav = q('#main-nav'), toggle = q('.nav-toggle');
toggle.onclick = () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', open); toggle.textContent = open ? '✕' : '☰'; };
qa('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); toggle.textContent = '☰'; }));

/* Reveal */
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), {threshold:.12});
qa('.reveal').forEach(el => observer.observe(el));
