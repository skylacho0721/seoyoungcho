const CATEGORY_COLOR_VAR = {
  '관광지': '--cat-1', '문화시설': '--cat-2', '축제공연행사': '--cat-3', '여행코스': '--cat-4',
  '레포츠': '--cat-5', '숙박': '--cat-6', '쇼핑': '--cat-7', '음식점': '--cat-8',
};
function categoryColor(cat) {
  const varName = CATEGORY_COLOR_VAR[cat] || '--cat-etc';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

const PTY_LABEL = { '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '5': '빗방울', '6': '빗방울눈날림', '7': '눈날림' };
const PTY_ICON = { '0': '☀️', '1': '🌧️', '2': '🌨️', '3': '❄️', '5': '🌦️', '6': '🌨️', '7': '🌨️' };

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
  if (!currentWeather) { weatherCard.classList.add('hidden'); return; }
  const pty = currentWeather.PTY || '0';
  const icon = PTY_ICON[pty] || '🌤️';
  const state = PTY_LABEL[pty] || '';
  const temp = currentWeather['기온(℃)'];
  const stats = [
    { k: '체감/상태', v: state },
    { k: '습도', v: currentWeather['습도(%)'] ? currentWeather['습도(%)'] + '%' : '-' },
    { k: '풍속', v: currentWeather['풍속(m/s)'] ? currentWeather['풍속(m/s)'] + 'm/s' : '-' },
    { k: '강수량', v: currentWeather['1시간 강수량(mm)'] || '0' },
  ];
  weatherCard.innerHTML = `
    <div class="weather-main">
      <span class="weather-icon">${icon}</span>
      <div>
        <div class="weather-region">${escapeHtml(currentWeather['지역'])} 현재 날씨</div>
        <div class="weather-temp">${temp !== undefined ? temp + '℃' : '-'}</div>
      </div>
    </div>
    <div class="weather-stats">
      ${stats.map((s) => `<div class="weather-stat"><div class="v">${escapeHtml(String(s.v))}</div><div class="k">${s.k}</div></div>`).join('')}
    </div>
  `;
  weatherCard.classList.remove('hidden');
}

function renderSummary() {
  if (currentItems.length === 0) { summaryEl.classList.add('hidden'); return; }
  const counts = {};
  currentItems.forEach((it) => { counts[it.분류] = (counts[it.분류] || 0) + 1; });
  const max = Math.max(...Object.values(counts));
  categoryBars.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => {
      const color = categoryColor(cat);
      return `
      <div class="category-bar-row">
        <span class="category-bar-label"><span class="dot" style="background:${color}"></span>${escapeHtml(cat)}</span>
        <div class="category-bar-track"><div class="category-bar-fill" style="width:${(count / max) * 100}%;background:${color}"></div></div>
        <span class="category-bar-count">${count}</span>
      </div>
    `;
    }).join('');
  summaryEl.classList.remove('hidden');
}

function renderFilters() {
  if (currentItems.length === 0) { filterRow.classList.add('hidden'); return; }
  const categories = ['전체', ...new Set(currentItems.map((it) => it.분류))];
  filterChips.innerHTML = categories.map((cat) => {
    const color = cat === '전체' ? null : categoryColor(cat);
    const style = color ? `style="--chip-color:${color}"` : '';
    const dot = color ? `<span class="dot" style="background:${color}"></span>` : '';
    return `<button type="button" class="chip ${cat === activeFilter ? 'active' : ''}" data-cat="${cat}" ${style}>${dot}${escapeHtml(cat)}</button>`;
  }).join('');
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
  const rows = activeFilter === '전체' ? currentItems : currentItems.filter((it) => it.분류 === activeFilter);
  resultBody.innerHTML = rows.map((it) => {
    const color = categoryColor(it.분류);
    return `
    <tr>
      <td><span class="cat-badge" style="--badge-color:${color}"><span class="dot"></span>${escapeHtml(it.분류)}</span></td>
      <td>${escapeHtml(it.이름)}</td>
      <td class="addr">${escapeHtml(it.주소)}</td>
      <td class="tel">${escapeHtml(it.전화번호) || '-'}</td>
    </tr>
  `;
  }).join('');
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
    const { PTY, ...rest } = currentWeather;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ ...rest, 날씨상태: PTY_LABEL[PTY] || PTY }]), '날씨');
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
