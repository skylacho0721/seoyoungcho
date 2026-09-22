const keywordInput = document.getElementById('keyword');
const searchBtn = document.getElementById('searchBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusEl = document.getElementById('status');
const weatherCard = document.getElementById('weatherCard');
const summaryEl = document.getElementById('summary');
const categoryBars = document.getElementById('categoryBars');
const filterRow = document.getElementById('filterRow');
const filterChips = document.getElementById('filterChips');
const resultBody = document.getElementById('resultBody');

let currentItems = [];
let currentWeather = null;
let currentKeyword = '';
let activeFilter = '전체';

async function runSearch() {
  const keyword = keywordInput.value.trim();
  if (!keyword) {
    setStatus('키워드를 입력해주세요.', true);
    return;
  }

  setStatus('검색 중...');
  searchBtn.disabled = true;
  downloadBtn.disabled = true;
  clearResults();

  try {
    const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '검색에 실패했습니다.');

    currentItems = data.tourItems || [];
    currentWeather = data.weather || null;
    currentKeyword = data.keyword;
    activeFilter = '전체';

    if (currentItems.length === 0) {
      setStatus('검색 결과가 없습니다. 다른 키워드로 시도해보세요.', true);
    } else {
      setStatus(`총 ${currentItems.length}건의 관광정보를 찾았습니다.`);
      downloadBtn.disabled = false;
    }

    renderWeather();
    renderSummary();
    renderFilters();
    renderTable();
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    searchBtn.disabled = false;
  }
}

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

function clearResults() {
  weatherCard.classList.add('hidden');
  summaryEl.classList.add('hidden');
  filterRow.classList.add('hidden');
  resultBody.innerHTML = '';
}

function renderWeather() {
  if (!currentWeather) {
    weatherCard.classList.add('hidden');
    return;
  }
  const entries = Object.entries(currentWeather).filter(([k]) => k !== '지역');
  weatherCard.innerHTML = `
    <span class="w-title">🌤️ ${currentWeather['지역']} 현재 날씨</span>
    ${entries.map(([k, v]) => `<span class="w-item"><b>${k}</b>${v}</span>`).join('')}
  `;
  weatherCard.classList.remove('hidden');
}

function renderSummary() {
  if (currentItems.length === 0) {
    summaryEl.classList.add('hidden');
    return;
  }
  const counts = {};
  currentItems.forEach((it) => { counts[it.분류] = (counts[it.분류] || 0) + 1; });
  const max = Math.max(...Object.values(counts));

  categoryBars.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `
      <div class="category-bar-row">
        <span class="category-bar-label">${cat}</span>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width:${(count / max) * 100}%"></div>
        </div>
        <span class="category-bar-count">${count}</span>
      </div>
    `).join('');
  summaryEl.classList.remove('hidden');
}

function renderFilters() {
  if (currentItems.length === 0) {
    filterRow.classList.add('hidden');
    return;
  }
  const categories = ['전체', ...new Set(currentItems.map((it) => it.분류))];
  filterChips.innerHTML = categories.map((cat) => `
    <button type="button" class="chip ${cat === activeFilter ? 'active' : ''}" data-cat="${cat}">${cat}</button>
  `).join('');
  filterChips.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.cat;
      renderFilters();
      renderTable();
    });
  });
  filterRow.classList.remove('hidden');
}

function renderTable() {
  const rows = activeFilter === '전체'
    ? currentItems
    : currentItems.filter((it) => it.분류 === activeFilter);

  resultBody.innerHTML = rows.map((it) => `
    <tr>
      <td>${escapeHtml(it.분류)}</td>
      <td>${escapeHtml(it.이름)}</td>
      <td>${escapeHtml(it.주소)}</td>
      <td>${escapeHtml(it.전화번호) || '-'}</td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function downloadExcel() {
  if (currentItems.length === 0) return;

  const wb = XLSX.utils.book_new();

  const tourSheet = XLSX.utils.json_to_sheet(
    currentItems.map(({ 분류, 이름, 주소, 전화번호 }) => ({ 분류, 이름, 주소, 전화번호 }))
  );
  XLSX.utils.book_append_sheet(wb, tourSheet, '관광정보');

  if (currentWeather) {
    const weatherSheet = XLSX.utils.json_to_sheet([currentWeather]);
    XLSX.utils.book_append_sheet(wb, weatherSheet, '날씨');
  }

  const counts = {};
  currentItems.forEach((it) => { counts[it.분류] = (counts[it.분류] || 0) + 1; });
  const summarySheet = XLSX.utils.json_to_sheet(
    Object.entries(counts).map(([분류, 건수]) => ({ 분류, 건수 }))
  );
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약');

  XLSX.writeFile(wb, `공공데이터_${currentKeyword}.xlsx`);
}

searchBtn.addEventListener('click', runSearch);
downloadBtn.addEventListener('click', downloadExcel);
keywordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runSearch();
});
