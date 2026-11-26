// Add your Supabase project URL and anon/public key here after deployment setup.
// Never put a service_role key in a public website.
const SUPABASE_URL = 'https://veyshvtjyeioobkchjju.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nfGM7PpeTLTJZEaqN7evpA_QDEJNc8u';
let allJobs = [];
let activeCategory = 'All';
const list = document.getElementById('jobList');
const count = document.getElementById('listingCount');
document.getElementById('year').textContent = new Date().getFullYear();

function escapeHTML(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderJobs() {
  const term = document.getElementById('searchInput').value.trim().toLowerCase();
  const location = document.getElementById('locationFilter').value;
  const sort = document.getElementById('sortFilter').value;
  let rows = allJobs.filter(j => {
    const hay = [j.title,j.organization,j.department,j.location,j.education].join(' ').toLowerCase();
    const cat = activeCategory === 'All' || (j.job_type||'').toLowerCase().includes(activeCategory.toLowerCase());
    const loc = !location || (j.location||'').toLowerCase().includes(location.toLowerCase());
    return cat && loc && (!term || hay.includes(term));
  });
  rows.sort((a,b) => sort === 'deadline' ? new Date(a.last_date||'9999-12-31')-new Date(b.last_date||'9999-12-31') : new Date(b.created_at||0)-new Date(a.created_at||0));
  count.textContent = `${rows.length} ${rows.length===1?'opportunity':'opportunities'}`;
  if (!rows.length) { list.innerHTML = '<div class="empty-state">Abhi is filter mein koi job available nahi. Nayi verified listings add hone par yahan nazar aayengi.</div>'; return; }
  list.innerHTML = rows.map(j => `<article class="job-card"><div><span class="job-tag">${escapeHTML(j.job_type||'Job')}</span><h3>${escapeHTML(j.title)}</h3><div class="job-org">${escapeHTML(j.organization)}</div><div class="job-meta"><span>⌖ ${escapeHTML(j.location||'Pakistan')}</span><span>▣ ${escapeHTML(j.education||'Eligibility: see official ad')}</span><span>◷ Deadline: ${j.last_date?escapeHTML(j.last_date):'See official ad'}</span></div></div><div class="job-side"><small>${escapeHTML(j.department||'')}</small>${j.apply_link?`<a class="apply-btn" href="${escapeHTML(j.apply_link)}" target="_blank" rel="noopener noreferrer">Apply now ↗</a>`:'<span class="job-tag">Details coming soon</span>'}</div></article>`).join('');
}
async function loadJobs() {
  if (SUPABASE_URL.startsWith('YOUR_') || SUPABASE_ANON_KEY.startsWith('YOUR_') || !window.supabase) {
    count.textContent = 'Database setup pending';
    list.innerHTML = '<div class="empty-state">Website design ready hai. Live job listings dikhane ke liye aglay step mein Supabase connection add hoga.</div>';
    return;
  }
  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const {data,error} = await client.from('jobs').select('*').eq('is_active',true).order('created_at',{ascending:false});
    if (error) throw error;
    allJobs = data || []; renderJobs();
  } catch (e) { count.textContent = 'Jobs unavailable'; list.innerHTML = '<div class="empty-state">Jobs load nahi ho sakin. Database connection check karna hoga.</div>'; console.error(e); }
}
document.getElementById('searchForm').addEventListener('submit', e => { e.preventDefault(); renderJobs(); document.getElementById('jobs').scrollIntoView({behavior:'smooth'}); });
document.getElementById('sortFilter').addEventListener('change', renderJobs);
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { activeCategory=b.dataset.filter; document.querySelectorAll('.pill').forEach(x=>x.classList.toggle('active',x===b)); renderJobs(); }));
document.querySelectorAll('[data-category]').forEach(a => a.addEventListener('click', () => { activeCategory=a.dataset.category; document.querySelectorAll('.pill').forEach(x=>x.classList.toggle('active',x.dataset.filter===activeCategory)); renderJobs(); }));
loadJobs();
