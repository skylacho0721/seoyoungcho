require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ── 지역명 → 기상청 격자좌표(nx, ny) 매핑 ──────────────────────
// (기상청 단기예보 API는 위경도가 아닌 격자좌표를 사용함)
const REGION_COORDS = {
  '서울': { nx: 60, ny: 127 }, '부산': { nx: 98, ny: 76 }, '대구': { nx: 89, ny: 90 },
  '인천': { nx: 55, ny: 124 }, '광주': { nx: 58, ny: 74 }, '대전': { nx: 67, ny: 100 },
  '울산': { nx: 102, ny: 84 }, '세종': { nx: 66, ny: 103 }, '수원': { nx: 60, ny: 121 },
  '춘천': { nx: 73, ny: 134 }, '강릉': { nx: 92, ny: 131 }, '청주': { nx: 69, ny: 106 },
  '전주': { nx: 63, ny: 89 }, '포항': { nx: 102, ny: 94 }, '제주': { nx: 52, ny: 38 },
  '여수': { nx: 73, ny: 66 }, '경주': { nx: 100, ny: 91 }, '안동': { nx: 91, ny: 106 },
  '목포': { nx: 50, ny: 67 }, '성남': { nx: 62, ny: 123 }, '고양': { nx: 57, ny: 128 },
  '용인': { nx: 64, ny: 119 }, '평택': { nx: 62, ny: 114 }, '천안': { nx: 63, ny: 110 },
  '원주': { nx: 76, ny: 122 }, '속초': { nx: 87, ny: 141 }, '통영': { nx: 87, ny: 68 },
  '거제': { nx: 90, ny: 69 }, '남해': { nx: 78, ny: 61 }, '가평': { nx: 61, ny: 132 },
};

function findRegion(keyword) {
  const name = Object.keys(REGION_COORDS).find((r) => keyword.includes(r));
  return name ? { name, ...REGION_COORDS[name] } : null;
}

const TOUR_CATEGORY = {
  12: '관광지', 14: '문화시설', 15: '축제공연행사', 25: '여행코스',
  28: '레포츠', 32: '숙박', 38: '쇼핑', 39: '음식점',
};

// ── 한국관광공사 TourAPI: 키워드 검색 ──────────────────────
async function searchTourItems(keyword) {
  const key = process.env.TOUR_API_KEY;
  if (!key) throw new Error('TOUR_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');

  const url = new URL('https://apis.data.go.kr/B551011/KorService2/searchKeyword2');
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('numOfRows', '50');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'TourDataDashboard');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('arrange', 'A');
  url.searchParams.set('keyword', keyword);

  const r = await fetch(url);
  const data = await r.json();

  const header = data?.response?.header;
  if (!header || header.resultCode !== '0000') {
    throw new Error(`TourAPI 오류: ${header?.resultMsg || '알 수 없는 오류'}`);
  }

  const items = data?.response?.body?.items?.item || [];
  const list = Array.isArray(items) ? items : [items];

  return list.map((it) => ({
    분류: TOUR_CATEGORY[it.contenttypeid] || '기타',
    이름: it.title || '',
    주소: it.addr1 || '',
    전화번호: it.tel || '',
    이미지: it.firstimage || '',
    contentId: it.contentid || '',
  }));
}

// ── 기상청 단기예보: 초단기실황(현재 날씨) ──────────────────────
function getBaseDateTime() {
  // 서버의 로컬 타임존과 무관하게 KST(UTC+9) 기준으로 계산
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  let hour = kst.getUTCHours();
  let date = kst;
  if (kst.getUTCMinutes() < 40) {
    date = new Date(kst.getTime() - 60 * 60 * 1000);
    hour = date.getUTCHours();
  }
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return { base_date: `${yyyy}${mm}${dd}`, base_time: `${String(hour).padStart(2, '0')}00` };
}

const WEATHER_LABEL = {
  T1H: '기온(℃)', REH: '습도(%)', WSD: '풍속(m/s)', RN1: '1시간 강수량(mm)',
};

async function getWeather(region) {
  const key = process.env.WEATHER_API_KEY;
  if (!key) return null;

  const { base_date, base_time } = getBaseDateTime();
  const url = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst');
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', '10');
  url.searchParams.set('dataType', 'JSON');
  url.searchParams.set('base_date', base_date);
  url.searchParams.set('base_time', base_time);
  url.searchParams.set('nx', region.nx);
  url.searchParams.set('ny', region.ny);

  const r = await fetch(url);
  const data = await r.json();
  const header = data?.response?.header;
  if (!header || header.resultCode !== '00') return null;

  const items = data?.response?.body?.items?.item || [];
  const result = { 지역: region.name };
  items.forEach((it) => {
    if (it.category === 'PTY') result['PTY'] = it.obsrValue;
    else if (WEATHER_LABEL[it.category]) result[WEATHER_LABEL[it.category]] = it.obsrValue;
  });
  return result;
}

app.get('/api/search', async (req, res) => {
  const keyword = (req.query.keyword || '').trim();
  if (!keyword) return res.status(400).json({ error: '키워드를 입력하세요.' });

  try {
    const tourItems = await searchTourItems(keyword);
    const region = findRegion(keyword);
    const weather = region ? await getWeather(region).catch(() => null) : null;
    res.json({ keyword, tourItems, weather });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`✅ 공공데이터 대시보드: http://localhost:${PORT}`));
