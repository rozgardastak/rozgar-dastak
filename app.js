// Rozgar Dastak public jobs browser.
// The publishable key is safe for browser use when database RLS is configured.
// Never place a Supabase service_role/secret key in this file.
const SUPABASE_URL = 'https://veyshvtjyeioobkchjju.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nfGM7PpeTLTJZEaqN7evpA_QDEJNc8u';

let allJobs = [];
let activeCategory = 'All';
const list = document.getElementById('jobList');
const count = document.getElementById('listingCount');
document.getElementById('year').textContent = new Date().getFullYear();

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function categoryMatches(job, category) {
  if (category === 'All') return true;
  const type = String(job.job_type || '').toLowerCase();
  const location = String(job.location || '').toLowerCase();
  if (category === 'Government') return type.includes('government') || type.includes('federal');
  if (category === 'Private') return type.includes('private') || type.includes('corporate');
  if (category === 'Bank') return type.includes('bank');
  if (category === 'Remote') return type.includes('remote') || location.includes('remote') || location.includes('work from home');
  return type.includes(category.toLowerCase());
}

function renderJobs() {
  const term = document.getElementById('searchInput').value.trim().toLowerCase();
  const location = document.getElementById('locationFilter').value.toLowerCase();
  const sort = document.getElementById('sortFilter').value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let rows = allJobs.filter(job => {
    const haystack = [
      job.title, job.organization, job.department, job.location,
      job.province, job.education, job.description, job.job_type
    ].join(' ').toLowerCase();
    const categoryOK = categoryMatches(job, activeCategory);
    const locationOK = !location ||
      String(job.location || '').toLowerCase().includes(location) ||
      String(job.province || '').toLowerCase().includes(location);
    const notExpired = !job.last_date || new Date(job.last_date + 'T23:59:59') >= today;
    return categoryOK && locationOK && notExpired && (!term || haystack.includes(term));
  });

  rows.sort((a, b) => {
    if (sort === 'deadline') {
      return new Date(a.last_date || '9999-12-31') - new Date(b.last_date || '9999-12-31');
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  count.textContent = `${rows.length} ${rows.length === 1 ? 'opportunity' : 'opportunities'}`;
  if (!rows.length) {
    const emptyMessage = activeCategory === 'Private' || activeCategory === 'Remote'
      ? 'Is category mein abhi verified listing available nahi. Jald hi official-source vacancies add ki jayengi.'
      : 'Is search ya filter mein abhi koi active job nahi mili. Search ya location filter change karke dekhein.';
    list.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  list.innerHTML = rows.map(job => `
    <article class="job-card">
      <div>
        <span class="job-tag">${escapeHTML(job.job_type || 'Job')}</span>
        <h3>${escapeHTML(job.title)}</h3>
        <div class="job-org">${escapeHTML(job.organization)}</div>
        <div class="job-meta">
          <span>⌖ ${escapeHTML(job.location || job.province || 'Pakistan')}</span>
          <span>▣ ${escapeHTML(job.education || 'Eligibility: see official ad')}</span>
          <span>◷ Deadline: ${job.last_date ? escapeHTML(job.last_date) : 'See official ad'}</span>
        </div>
        ${job.description ? `<p class="job-description">${escapeHTML(job.description)}</p>` : ''}
      </div>
      <div class="job-side">
        <small>${escapeHTML(job.department || '')}</small>
        ${job.apply_link && /^https:\/\//i.test(job.apply_link)
          ? `<a class="apply-btn" href="${escapeHTML(job.apply_link)}" target="_blank" rel="noopener noreferrer nofollow">Official apply ↗</a>`
          : '<span class="job-tag">Official link not added</span>'}
      </div>
    </article>`).join('');
}

async function loadJobs() {
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    count.textContent = 'Database unavailable';
    list.innerHTML = '<div class="empty-state">Jobs database filhal connect nahi ho saki. Thori dair baad dobara try karein.</div>';
    return;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from('jobs')
      .select('id,title,organization,department,job_type,location,province,education,last_date,apply_link,description,is_active,created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    allJobs = data || [];
    renderJobs();
  } catch (error) {
    count.textContent = 'Jobs unavailable';
    list.innerHTML = '<div class="empty-state">Jobs load nahi ho sakin. Database access ya connection check karna hoga.</div>';
    console.error('Rozgar Dastak jobs error:', error);
  }
}

document.getElementById('searchForm').addEventListener('submit', event => {
  event.preventDefault();
  renderJobs();
  document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('sortFilter').addEventListener('change', renderJobs);
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    document.querySelectorAll('.pill').forEach(item => item.classList.toggle('active', item === button));
    renderJobs();
  });
});
document.querySelectorAll('[data-category]').forEach(link => {
  link.addEventListener('click', () => {
    activeCategory = link.dataset.category;
    document.querySelectorAll('.pill').forEach(item => item.classList.toggle('active', item.dataset.filter === activeCategory));
    renderJobs();
  });
});
loadJobs();
