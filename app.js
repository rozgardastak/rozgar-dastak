// Rozgar Dastak — concise, readable job listings
const SUPABASE_URL = 'https://veyshvtjyeioobkchjju.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nfGM7PpeTLTJZEaqN7evpA_QDEJNc8u';
let allJobs = [];
let activeCategory = 'All';
let visibleLimit = 10;
const list = document.getElementById('jobList');
const count = document.getElementById('listingCount');
document.getElementById('year').textContent = new Date().getFullYear();
const initialQuery = new URLSearchParams(window.location.search).get('q');
if (initialQuery) document.getElementById('searchInput').value = initialQuery;

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function categoryMatches(job, category) {
  if (category === 'All') return true;
  const type = String(job.job_type || '').toLowerCase();
  const location = String(job.location || '').toLowerCase();
  if (category === 'Government') return /government|federal|public sector|govt/.test(type);
  if (category === 'Private') return /private|corporate/.test(type);
  if (category === 'Bank') return /bank/.test(type + ' ' + String(job.organization || ''));
  if (category === 'Remote') return /remote|work from home/.test(type + ' ' + location);
  return type.includes(category.toLowerCase());
}
function formatDate(value) {
  if (!value) return 'See advertisement';
  const d = new Date(value + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
function formatRequirementDetails(raw) {
  let text = String(raw || '').replace(/\r/g, '').trim();
  if (!text) return '';
  const labels = ['Height if required','Application Process','Required Documents','Physical Standard','Physical Test','Application Fee','How to Apply','Typing Speed','No. of Posts','Qualification','Experience','Education','Age Limit','Domicile','Gender','Salary','Pay Scale','Vacancies','Last Date','Job Type','Test Fee','Running','Height','Age','BPS','Skills'];
  const labelPattern = labels.join('|');
  // Split long single-line descriptions before labelled requirements.
  text = text.replace(new RegExp('\\s+(?=(' + labelPattern + ')\\s*:)', 'gi'), '\n');
  return text.split(/\n+/).map(line => {
    const clean = line.trim().replace(/^[-•▪●]+\s*/, '');
    if (!clean) return '';
    const match = clean.match(/^([^:]{2,55}):\s*(.*)$/);
    if (match) return '<div class="requirement-row"><strong>' + escapeHTML(match[1].trim()) + '</strong><span>' + escapeHTML(match[2].trim()) + '</span></div>';
    return '<p class="requirement-note">' + escapeHTML(clean) + '</p>';
  }).join('');
}
function renderJobs() {')).join('|') + ')\\s*:)', 'gi');
  text = text.replace(pattern, '\\n');
  return text.split(/\\n+/).map(line => {
    const clean = line.trim().replace(/^[-•▪●]+\\s*/, '');
    if (!clean) return '';
    const match = clean.match(/^([^:]{2,55}):\\s*(.*)$/);
    if (match) return '<div class="requirement-row"><strong>' + escapeHTML(match[1].trim()) + '</strong><span>' + escapeHTML(match[2].trim()) + '</span></div>';
    return '<p class="requirement-note">' + escapeHTML(clean) + '</p>';
  }).join('');
}
function renderJobs() {
  const term = document.getElementById('searchInput').value.trim().toLowerCase();
  const location = document.getElementById('locationFilter').value.toLowerCase();
  const sort = document.getElementById('sortFilter').value;
  const today = new Date(); today.setHours(0,0,0,0);
  let rows = allJobs.filter(job => {
    const haystack = [job.title,job.organization,job.department,job.location,job.province,job.education,job.description,job.job_type].join(' ').toLowerCase();
    const locationOK = !location || [job.location,job.province].join(' ').toLowerCase().includes(location);
    const notExpired = !job.last_date || new Date(job.last_date + 'T23:59:59') >= today;
    return categoryMatches(job,activeCategory) && locationOK && notExpired && (!term || haystack.includes(term));
  });
  rows.sort((a,b) => sort === 'deadline'
    ? new Date(a.last_date || '9999-12-31') - new Date(b.last_date || '9999-12-31')
    : new Date(b.created_at || 0) - new Date(a.created_at || 0));
  count.textContent = rows.length + (rows.length === 1 ? ' active vacancy' : ' active vacancies');
  if (!rows.length) {
    list.innerHTML = '<div class="empty-state"><strong>No active vacancies found</strong><span>Search ya location filter badal kar dobara dekhein.</span></div>';
    return;
  }
  const shown = rows.slice(0,visibleLimit);
  list.innerHTML = shown.map((job,index) => {
    const description = String(job.description || '').trim();
    const qualification = String(job.education || 'See official advertisement');
    const department = String(job.department || job.organization || 'Recruiting department');
    const apply = job.apply_link && /^https:\/\//i.test(job.apply_link)
      ? '<a class="apply-btn" href="' + escapeHTML(job.apply_link) + '" target="_blank" rel="noopener noreferrer nofollow">Apply online <span>↗</span></a>'
      : '<span class="apply-pending">Application link not available</span>';
    return `<article class="job-card compact-job">
      <div class="job-main">
        <div class="job-card-top"><span class="job-tag">${escapeHTML(job.job_type || 'Job Vacancy')}</span><span class="job-number">VACANCY ${String(index+1).padStart(2,'0')}</span></div>
        <h3>${escapeHTML(job.title || 'Position announced')}</h3>
        <div class="job-org">${escapeHTML(job.organization || 'Recruiting organisation')}</div>
        <div class="job-meta compact-meta">
          <span><b>Department</b>${escapeHTML(department)}</span>
          <span><b>Location</b>${escapeHTML(job.location || job.province || 'Pakistan')}</span>
          <span><b>Qualification</b><em title="${escapeHTML(qualification)}">${escapeHTML(qualification)}</em></span>
          <span><b>Last date</b>${escapeHTML(formatDate(job.last_date))}</span>
        </div>
        ${description ? `<details class="job-details"><summary>View job details</summary><div class="requirement-list">${formatRequirementDetails(description)}</div></details>` : ''}
      </div>
      <div class="job-action">${apply}</div>
    </article>`;
  }).join('');
  if (rows.length > visibleLimit) {
    list.insertAdjacentHTML('beforeend','<button class="load-more" id="loadMore">Show more vacancies <span>↓</span></button>');
    document.getElementById('loadMore').addEventListener('click',()=>{visibleLimit+=10;renderJobs();});
  }
}
async function loadJobs() {
  if (!window.supabase) {
    count.textContent='Jobs temporarily unavailable';
    list.innerHTML='<div class="empty-state"><strong>Jobs are temporarily unavailable</strong><span>Please refresh the page in a moment.</span></div>';
    return;
  }
  try {
    const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    const {data,error}=await client.from('jobs')
      .select('id,title,organization,department,job_type,location,province,education,last_date,apply_link,description,is_active,created_at')
      .eq('is_active',true).order('created_at',{ascending:false}).limit(1000);
    if(error) throw error;
    allJobs=data||[];renderJobs();
  } catch(error) {
    count.textContent='Jobs temporarily unavailable';
    list.innerHTML='<div class="empty-state"><strong>Jobs could not be loaded</strong><span>Please try again shortly.</span></div>';
    console.error('Rozgar Dastak jobs error:',error);
  }
}
document.getElementById('searchForm').addEventListener('submit',event=>{
  event.preventDefault();visibleLimit=10;renderJobs();document.getElementById('jobs').scrollIntoView({behavior:'smooth'});
});
document.getElementById('sortFilter').addEventListener('change',()=>{visibleLimit=10;renderJobs();});
document.getElementById('locationFilter').addEventListener('change',()=>{visibleLimit=10;renderJobs();});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  activeCategory=button.dataset.filter;visibleLimit=10;
  document.querySelectorAll('.pill').forEach(item=>item.classList.toggle('active',item===button));
  renderJobs();
}));
document.querySelectorAll('[data-category]').forEach(link=>link.addEventListener('click',()=>{
  activeCategory=link.dataset.category;visibleLimit=10;
  document.querySelectorAll('.pill').forEach(item=>item.classList.toggle('active',item.dataset.filter===activeCategory));
  renderJobs();
}));
loadJobs();
