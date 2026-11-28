// Rozgar Dastak — job listings powered by Supabase
const SUPABASE_URL = 'https://veyshvtjyeioobkchjju.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nfGM7PpeTLTJZEaqN7evpA_QDEJNc8u';

let allJobs = [];
let activeCategory = 'All';
let visibleLimit = 10;

const list = document.getElementById('jobList');
const count = document.getElementById('listingCount');
const searchInput = document.getElementById('searchInput');
const locationFilter = document.getElementById('locationFilter');
const sortFilter = document.getElementById('sortFilter');

document.getElementById('year').textContent = new Date().getFullYear();
const initialQuery = new URLSearchParams(window.location.search).get('q');
if (initialQuery) searchInput.value = initialQuery;

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function categoryMatches(job, category) {
  if (category === 'All') return true;
  const type = String(job.job_type || '').toLowerCase();
  const location = String(job.location || '').toLowerCase();
  const organisation = String(job.organization || '').toLowerCase();
  if (category === 'Government') return /government|federal|public sector|govt/.test(type);
  if (category === 'Private') return /private|corporate/.test(type);
  if (category === 'Bank') return /bank/.test(type + ' ' + organisation);
  if (category === 'Remote') return /remote|work from home/.test(type + ' ' + location);
  return type.includes(category.toLowerCase());
}

function formatDate(value) {
  if (!value) return 'See advertisement';
  const date = new Date(value + 'T00:00:00');
  return Number.isNaN(date.getTime())
    ? escapeHTML(value)
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRequirementDetails(raw) {
  const text = String(raw || '').replace(/\r/g, '').trim();
  if (!text) return '';
  const labels = [
    'Height if required', 'Application Process', 'Required Documents',
    'Physical Standard', 'Physical Test', 'Application Fee', 'How to Apply',
    'Typing Speed', 'No. of Posts', 'Qualification', 'Experience',
    'Education', 'Age Limit', 'Domicile', 'Gender', 'Salary',
    'Pay Scale', 'Vacancies', 'Last Date', 'Job Type', 'Test Fee',
    'Running', 'Height', 'Age', 'BPS', 'Skills'
  ];
  const pattern = new RegExp('\\s+(?=(' + labels.join('|') + ')\\s*:)', 'gi');
  return text.replace(pattern, '\n').split(/\n+/).map(line => {
    const clean = line.trim().replace(/^[-•▪●]+\s*/, '');
    if (!clean) return '';
    const match = clean.match(/^([^:]{2,55}):\s*(.*)$/);
    if (match) {
      return '<div class="requirement-row"><strong>' + escapeHTML(match[1].trim()) +
        '</strong><span>' + escapeHTML(match[2].trim()) + '</span></div>';
    }
    return '<p class="requirement-note">' + escapeHTML(clean) + '</p>';
  }).join('');
}

function renderJobs() {
  const term = searchInput.value.trim().toLowerCase();
  const location = locationFilter.value.trim().toLowerCase();
  const sort = sortFilter.value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let rows = allJobs.filter(job => {
    const haystack = [
      job.title, job.organization, job.department, job.location,
      job.province, job.education, job.description, job.job_type
    ].join(' ').toLowerCase();
    const locationText = [job.location, job.province].join(' ').toLowerCase();
    const provinceText = String(job.province || '').trim().toLowerCase();
    const allPakistan = /^(all pakistan|pakistan|nationwide|pan pakistan)$/.test(provinceText) ||
      /\\b(all pakistan|pan pakistan|nationwide)\\b/i.test(String(job.location || ''));
    const locationOK = !location || allPakistan || locationText.includes(location);
    const notExpired = !job.last_date ||
      new Date(job.last_date + 'T23:59:59') >= today;
    return categoryMatches(job, activeCategory) && locationOK &&
      notExpired && (!term || haystack.includes(term));
  });

  rows.sort((a, b) => sort === 'deadline'
    ? new Date(a.last_date || '9999-12-31') - new Date(b.last_date || '9999-12-31')
    : new Date(b.created_at || 0) - new Date(a.created_at || 0));

  count.textContent = rows.length +
    (rows.length === 1 ? ' active vacancy' : ' active vacancies');

  if (!rows.length) {
    list.innerHTML = '<div class="empty-state"><strong>No active vacancies found</strong><span>Search ya location filter badal kar dobara dekhein.</span></div>';
    return;
  }

  list.innerHTML = rows.slice(0, visibleLimit).map((job, index) => {
    const description = String(job.description || '').trim();
    const qualification = String(job.education || 'See official advertisement');
    const department = String(job.department || job.organization || 'Recruiting department');
    const applyLink = String(job.apply_link || '').trim();
    const isEmailApply = /^mailto:[^\\s]+$/i.test(applyLink);
    const isWebApply = /^https:\/\//i.test(applyLink);
    const isPostal = /\\b(?:postal|courier|by hand|by post|send (?:your )?application)\\b/i.test(
      String(job.description || '')
    );
    const apply = isEmailApply
      ? '<a class="apply-btn" href="' + escapeHTML(applyLink) + '">Apply by Email <span>↗</span></a>'
      : isWebApply
        ? '<a class="apply-btn" href="' + escapeHTML(applyLink) +
          '" target="_blank" rel="noopener noreferrer nofollow">' +
          (isPostal ? 'Application Instructions' : 'Apply online') + ' <span>↗</span></a>'
        : '<span class="apply-pending">Application link not available</span>';

    return `<article class="job-card compact-job">
      <div class="job-main">
        <div class="job-card-top"><span class="job-tag">${escapeHTML(job.job_type || 'Job Vacancy')}</span><span class="job-number">VACANCY ${String(index + 1).padStart(2, '0')}</span></div>
        <h3>${escapeHTML(job.title || 'Position announced')}</h3>
        <div class="job-org">${escapeHTML(job.organization || 'Recruiting organisation')}</div>
        <div class="job-meta compact-meta">
          <span><b>Department</b>${escapeHTML(department)}</span>
          <span><b>Location</b>${escapeHTML(job.location || job.province || 'Pakistan')}</span>
          <span><b>Qualification</b><em title="${escapeHTML(qualification)}">${escapeHTML(qualification)}</em></span>
          <span><b>Last date</b>${formatDate(job.last_date)}</span>
        </div>
        ${description ? '<details class="job-details"><summary>View job details</summary><div class="requirement-list">' + formatRequirementDetails(description) + '</div></details>' : ''}
      </div>
      <div class="job-action">${apply}</div>
    </article>`;
  }).join('');

  if (rows.length > visibleLimit) {
    list.insertAdjacentHTML('beforeend', '<button class="load-more" id="loadMore">Show more vacancies <span>↓</span></button>');
    document.getElementById('loadMore').addEventListener('click', () => {
      visibleLimit += 10;
      renderJobs();
    });
  }
}

async function loadJobs() {
  try {
    const columns = 'id,title,organization,department,job_type,location,province,education,last_date,apply_link,description,is_active,created_at';
    const endpoint = SUPABASE_URL + '/rest/v1/jobs?select=' + encodeURIComponent(columns) +
      '&is_active=eq.true&order=created_at.desc&limit=1000';
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY
      },
      cache: 'no-store'
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error('Supabase API ' + response.status + ': ' + detail.slice(0, 250));
    }
    const data = await response.json();
    allJobs = Array.isArray(data) ? data : [];
    renderJobs();
  } catch (error) {
    count.textContent = 'Jobs temporarily unavailable';
    list.innerHTML = '<div class="empty-state"><strong>Jobs could not be loaded</strong><span>Please refresh the page in a moment.</span></div>';
    console.error('Rozgar Dastak jobs error:', error);
  }
}

document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  visibleLimit = 10;
  renderJobs();
  document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
});
sortFilter.addEventListener('change', () => { visibleLimit = 10; renderJobs(); });
locationFilter.addEventListener('change', () => { visibleLimit = 10; renderJobs(); });

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    visibleLimit = 10;
    document.querySelectorAll('.pill').forEach(item =>
      item.classList.toggle('active', item === button));
    renderJobs();
  });
});

document.querySelectorAll('[data-category]').forEach(link => {
  link.addEventListener('click', () => {
    activeCategory = link.dataset.category;
    visibleLimit = 10;
    document.querySelectorAll('.pill').forEach(item =>
      item.classList.toggle('active', item.dataset.filter === activeCategory));
    renderJobs();
  });
});

loadJobs();
