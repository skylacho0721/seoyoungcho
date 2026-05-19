// CLOCK
function tick(){var n=new Date(),d=['일','월','화','수','목','금','토'];document.getElementById('clk').innerHTML=n.getFullYear()+'.'+String(n.getMonth()+1).padStart(2,'0')+'.'+String(n.getDate()).padStart(2,'0')+' ('+d[n.getDay()]+')<small>'+String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+':'+String(n.getSeconds()).padStart(2,'0')+' · 서울 22°C</small>';}
tick();setInterval(tick,1000);

// TODO
var todos=[
  {id:1,title:'Q2 경영실적 보고서 최종본 결재 상신',tag:'결재',dday:'D-1',score:95,done:false},
  {id:2,title:'5/15 임원회의 예약 및 자료 8부 출력',tag:'회의',dday:'D-2',score:88,done:false},
  {id:3,title:'S기재차 견적서 회신 (김부장님)',tag:'일반',dday:'D-1',score:85,done:false},
  {id:4,title:'사무용품 분기 재고 점검 및 발주 기안',tag:'일반',dday:'D-5',score:72,done:false},
  {id:5,title:'4월 법인카드 사용내역 정산 보고',tag:'보고',dday:'D-1',score:68,done:false}
],nid=6,flt='전체';
function rTodos(){var list=flt==='전체'?todos:todos.filter(function(t){return t.tag===flt;});document.getElementById('tlist').innerHTML=list.map(function(t){return '<div class="ti"><div class="tck'+(t.done?' done':'')+'" data-id="'+t.id+'">'+(t.done?'✓':'')+'</div><div style="flex:1"><div class="ttxt'+(t.done?' done':'')+'">'+t.title+'</div><div class="tags"><span class="tag '+t.tag+'">'+t.tag+'</span><span class="tag dd">'+t.dday+'</span></div></div><div class="tscore">'+t.score+'</div></div>';}).join('');document.querySelectorAll('.tck').forEach(function(el){el.addEventListener('click',function(){var t=todos.find(function(x){return x.id==el.dataset.id;});if(t){t.done=!t.done;rTodos();}});});}
document.getElementById('ttabs').addEventListener('click',function(e){if(e.target.classList.contains('ttab')){document.querySelectorAll('.ttab').forEach(function(t){t.classList.remove('a');});e.target.classList.add('a');flt=e.target.dataset.f;rTodos();}});
document.getElementById('tbtn').addEventListener('click',function(){var i=document.getElementById('tinput');if(!i.value.trim())return;todos.unshift({id:nid++,title:i.value.trim(),tag:'일반',dday:'D-?',score:Math.floor(Math.random()*30+50),done:false});i.value='';rTodos();});
document.getElementById('tinput').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('tbtn').click();});
rTodos();

// CALENDAR with click events
var cY=2026,cM=4,evts=[5,13,15,20,22,27],mn=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
var calEvents={
  5:['📋 Q2 보고서 초안 제출','👥 팀 주간 회의 (14:00)'],
  13:['📊 마케팅팀 미팅 (10:00)','✍️ 계약서 검토 마감'],
  15:['🎯 임원회의 자료 마감','📦 사무용품 발주 기안'],
  19:['📅 오늘 · 결재 3건 대기','💳 법인카드 정산 마감'],
  20:['📄 임원의 자료 최종 마감 (09:00)','🏢 외부 미팅 메가존'],
  22:['📈 KPI 월간 리뷰','🔄 시스템 점검'],
  27:['🌴 연차 시작','📬 업무 인수인계 완료'],
};
var selDay=null;
function rCal(){
  document.getElementById('caltit').textContent=cY+'년 '+mn[cM];
  var g=document.getElementById('caldays');g.innerHTML='';
  var fd=new Date(cY,cM,1).getDay(),ld=new Date(cY,cM+1,0).getDate(),pv=new Date(cY,cM,0).getDate();
  var td=new Date(),sm=(td.getFullYear()===cY&&td.getMonth()===cM);
  for(var i=fd-1;i>=0;i--){var dd=document.createElement('div');dd.className='calday other';dd.textContent=pv-i;g.appendChild(dd);}
  for(var day=1;day<=ld;day++){
    var el=document.createElement('div'),dow=new Date(cY,cM,day).getDay(),c='calday';
    if(sm&&day===td.getDate())c+=' today';
    else if(dow===0)c+=' sun';
    else if(dow===6)c+=' sat';
    if(evts.indexOf(day)>=0&&!(sm&&day===td.getDate()))c+=' evt';
    if(selDay===day)c+=' selected';
    el.className=c;el.textContent=day;
    el.dataset.day=day;
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var d=parseInt(this.dataset.day);
      selDay=(selDay===d)?null:d;
      rCal();
      showCalPopup(d,this);
    });
    g.appendChild(el);
  }
  var rem=(7-(fd+ld)%7)%7;
  for(var r=1;r<=rem;r++){var el2=document.createElement('div');el2.className='calday other';el2.textContent=r;g.appendChild(el2);}
}
function showCalPopup(day,el){
  var pop=document.getElementById('cal-popup');
  if(!pop)return;
  if(selDay===null){pop.style.display='none';return;}
  var evList=calEvents[day];
  var html='<div class="cp-title">📅 '+cY+'년 '+mn[cM]+' '+day+'일</div>';
  if(evList&&evList.length){
    evList.forEach(function(e){html+='<div class="cp-item"><span>'+e+'</span></div>';});
  } else {
    html+='<div class="cp-empty">등록된 일정이 없습니다.<br><span style="color:var(--rg);cursor:pointer" onclick="alert(\'일정 추가 기능\')">+ 일정 추가</span></div>';
  }
  pop.innerHTML=html;
  pop.style.display='block';
  var rect=el.getBoundingClientRect();
  pop.style.top=(el.offsetTop+el.offsetHeight+4)+'px';
  pop.style.left=Math.max(0,el.offsetLeft-60)+'px';
}
document.addEventListener('click',function(){selDay=null;var pop=document.getElementById('cal-popup');if(pop)pop.style.display='none';rCal();});
document.getElementById('calP').addEventListener('click',function(){cM--;if(cM<0){cM=11;cY--;}selDay=null;rCal();});
document.getElementById('calN').addEventListener('click',function(){cM++;if(cM>11){cM=0;cY++;}selDay=null;rCal();});
rCal();

// GANTT
var GS=8,GR=10,gh=document.getElementById('ghd'),gw=document.getElementById('grows');
gh.innerHTML='<div style="width:60px;flex-shrink:0"></div>';
for(var h=9;h<=17;h++)gh.innerHTML+='<div class="gtime">'+h+'시</div>';
[{n:'대책회의',b:[{s:8,e:9.5,c:'#f2a7bedd',l:'대책회의'}]},{n:'A회의실',b:[{s:10,e:11,c:'#7ab8f5dd',l:'마케팅팀'},{s:14,e:16,c:'#6ed89add',l:'임원회의'}]},{n:'B회의실',b:[{s:9,e:10.5,c:'#f472b6dd',l:'기획TF'},{s:13,e:14.5,c:'#f0c96add',l:'외부미팅'}]},{n:'화상회의',b:[{s:11,e:12,c:'#c084f5dd',l:'원격팀'}]}].forEach(function(m){var r=document.createElement('div');r.className='grow';r.innerHTML='<div class="glbl">'+m.n+'</div><div class="gtrack">'+m.b.map(function(b){return '<div class="gblock" style="left:'+((b.s-GS)/GR*100).toFixed(1)+'%;width:'+((b.e-b.s)/GR*100).toFixed(1)+'%;background:'+b.c+'">'+b.l+'</div>';}).join('')+'</div>';gw.appendChild(r);});

// MILESTONE
setTimeout(function(){[[1,78],[2,95],[3,45],[4,19]].forEach(function(p){document.getElementById('m'+p[0]).style.width=p[1]+'%';});},400);

// CHARTS
new Chart(document.getElementById('lc'),{type:'doughnut',data:{labels:['사용','예정','잔여'],datasets:[{data:[4,2,11],backgroundColor:['#e8799a','#f2a7be','#2c1b2a'],borderColor:['#d45075','#e8799a','#3c2438'],borderWidth:2}]},options:{cutout:'72%',plugins:{legend:{display:false}},animation:{duration:1200},responsive:true,maintainAspectRatio:true}});
new Chart(document.getElementById('kpichart'),{type:'line',data:{labels:['1주','2주','3주','4주','5주'],datasets:[{label:'처리 건수',data:[18,22,19,25,28],borderColor:'#f2a7be',backgroundColor:'rgba(242,167,190,.1)',tension:.4,pointBackgroundColor:'#f2a7be',pointRadius:3,fill:true},{label:'완료율(%)',data:[72,78,74,85,91],borderColor:'#f0c96a',backgroundColor:'rgba(240,201,106,.07)',tension:.4,pointBackgroundColor:'#f0c96a',pointRadius:3,fill:true}]},options:{responsive:true,plugins:{legend:{labels:{color:'#d4a8bc',font:{size:9},boxWidth:10,padding:8}}},scales:{x:{ticks:{color:'#7a5068',font:{size:8}},grid:{color:'rgba(242,167,190,.07)'}},y:{ticks:{color:'#7a5068',font:{size:8}},grid:{color:'rgba(242,167,190,.07)'}}}}});

// FILE UPLOAD
document.getElementById('uploadArea').addEventListener('click',function(){document.getElementById('fi').click();});
document.getElementById('fi').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;document.getElementById('ur').innerHTML='<div style="color:var(--rg);font-weight:700;margin-bottom:5px">📊 '+f.name+' 분석 완료</div><div>• 총 사용액: <b>₩ 847,500</b></div><div>• 식대 ₩320,000 (37.8%) · 교통비 ₩185,000 · 사무용품 ₩142,500</div><div style="margin-top:5px;color:var(--yel)">⚠️ 전월 대비 12.3% 증가 — 예산 검토 권장</div>';});

// HEATMAP
(function(){
  var days=['월','화','수','목','금'];
  var times=['9','10','11','12','13','14','15','16','17','18'];
  var data=[[2,4,5,3,2,4,3,2,1,0],[3,5,4,2,3,3,4,3,2,1],[4,5,5,3,4,5,4,3,2,1],[3,4,3,2,2,3,3,2,1,0],[2,3,4,3,2,2,2,1,1,0]];
  var wrap=document.getElementById('heatmap');
  if(!wrap)return;
  var html='<div style="display:inline-grid;grid-template-columns:20px repeat('+times.length+',18px);gap:2px;">';
  html+='<div></div>';
  times.forEach(function(t){html+='<div style="text-align:center;font-size:7px;color:var(--muted);line-height:1;">'+t+'</div>';});
  days.forEach(function(day,di){
    html+='<div style="font-size:8px;color:var(--muted);text-align:right;padding-right:3px;line-height:18px;">'+day+'</div>';
    data[di].forEach(function(v){
      var op=v===0?0.06:v===1?0.2:v===2?0.4:v===3?0.6:v===4?0.8:1;
      html+='<div style="width:18px;height:18px;border-radius:3px;background:rgba(212,80,117,'+op+');"></div>';
    });
  });
  html+='</div>';
  wrap.innerHTML=html;
})();

// ENERGY CHART
new Chart(document.getElementById('energychart'),{
  type:'bar',
  data:{
    labels:['월','화','수','목','금','토','일'],
    datasets:[{label:'에너지',data:[75,82,68,90,71,60,55],backgroundColor:['rgba(242,167,190,.7)','rgba(232,121,154,.8)','rgba(242,167,190,.5)','rgba(212,80,117,.9)','rgba(242,167,190,.65)','rgba(112,80,104,.5)','rgba(112,80,104,.4)'],borderColor:'#f2a7be',borderWidth:1,borderRadius:4}]
  },
  options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#7a5068',font:{size:8}},grid:{display:false}},y:{min:0,max:100,ticks:{color:'#7a5068',font:{size:8},callback:function(v){return v+'%';}},grid:{color:'rgba(242,167,190,.07)'}}}}
});

// ── 실시간 환율 시뮬레이션 (30초마다 업데이트) ──
var exRates={
  'USD/KRW':{rate:1378.50,change:-4.20,pct:-0.30},
  'JPY/KRW':{rate:8.92,change:-0.05,pct:-0.59},
  'EUR/KRW':{rate:1492.30,change:-2.10,pct:-0.14},
  'CNY/KRW':{rate:190.45,change:-0.30,pct:-0.16}
};
var exIds=['usd','jpy','eur','cny'];
var exKeys=Object.keys(exRates);

function renderExchange(){
  exKeys.forEach(function(k,i){
    var d=exRates[k],id=exIds[i];
    var el=document.getElementById('ex-'+id);
    if(!el)return;
    var up=d.change>=0;
    el.innerHTML='<div class="ep">'+k+'</div><div class="er" id="er-'+id+'">'+d.rate.toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</div><div class="ec '+(up?'up':'dn')+'">'+(up?'▲':'▼')+' '+Math.abs(d.change).toFixed(2)+' ('+Math.abs(d.pct).toFixed(2)+'%)</div>';
  });
}

function updateExchange(){
  exKeys.forEach(function(k){
    var d=exRates[k];
    var delta=(Math.random()-0.5)*d.rate*0.0008;
    d.rate=Math.round((d.rate+delta)*100)/100;
    d.change=Math.round((d.change+delta)*100)/100;
    d.pct=Math.round(d.change/d.rate*10000)/100;
  });
  renderExchange();
  // flash effect
  exIds.forEach(function(id){
    var er=document.getElementById('er-'+id);
    if(er){er.classList.remove('flash');void er.offsetWidth;er.classList.add('flash');}
  });
}
renderExchange();
setInterval(updateExchange,8000);

// ── 알림 클릭 시 dismiss ──
document.querySelectorAll('.alrt').forEach(function(el){
  el.style.cursor='pointer';
  el.title='클릭하여 읽음 처리';
  el.addEventListener('click',function(){
    this.classList.add('dismissing');
    var self=this;
    setTimeout(function(){self.remove();},200);
  });
});

// ── 문서 상태 클릭 토글 ──
var docStatuses=['긴급','대기','검토','선결','완료'];
document.querySelectorAll('.di').forEach(function(el){
  el.style.cursor='pointer';
  el.title='클릭하여 상태 변경';
  el.addEventListener('click',function(){
    var badge=this.querySelector('.dbadge');
    if(!badge)return;
    var cur=badge.textContent.trim();
    var idx=docStatuses.indexOf(cur);
    var next=docStatuses[(idx+1)%docStatuses.length];
    badge.textContent=next;
    badge.className='dbadge '+next;
    var colors={긴급:'var(--red)',대기:'var(--yel)',검토:'var(--blu)',선결:'var(--grn)',완료:'var(--muted)'};
    var borders={긴급:'var(--red)',대기:'var(--yel)',검토:'var(--blu)',선결:'var(--grn)',완료:'var(--muted)'};
    this.style.borderLeftColor=borders[next]||'var(--rg3)';
  });
});

// ── 마일스톤 바 클릭하여 진행률 조정 ──
[[1,78],[2,95],[3,45],[4,19]].forEach(function(p){
  var bar=document.getElementById('m'+p[0]);
  if(!bar)return;
  var parent=bar.parentElement;
  parent.style.cursor='pointer';
  parent.title='클릭하여 진행률 조정';
  parent.addEventListener('click',function(e){
    var rect=this.getBoundingClientRect();
    var pct=Math.round((e.clientX-rect.left)/rect.width*100);
    pct=Math.max(0,Math.min(100,pct));
    bar.style.width=pct+'%';
    var msh=this.closest('.ms');
    if(msh){var sp=msh.querySelector('.msp');if(sp)sp.textContent=pct+'%';}
  });
});

// ── KPI 헤더 뱃지 클릭 시 하이라이트 ──
document.querySelectorAll('.kpi').forEach(function(el,i){
  el.style.cursor='pointer';
  el.addEventListener('click',function(){
    document.querySelectorAll('.kpi').forEach(function(k){k.style.borderColor='';});
    this.style.borderColor='var(--rg)';
    this.style.boxShadow='0 0 10px rgba(242,167,190,.3)';
    setTimeout(function(){document.querySelectorAll('.kpi').forEach(function(k){k.style.borderColor='';k.style.boxShadow='';});},1500);
  });
});

// ── Gantt 블록 hover 툴팁 ──
var tt=document.createElement('div');tt.className='tt';tt.id='tooltip';document.body.appendChild(tt);
document.querySelectorAll('.gblock').forEach(function(el){
  el.addEventListener('mouseenter',function(e){
    tt.textContent=this.textContent+' — 클릭하여 상세보기';
    tt.style.display='block';
  });
  el.addEventListener('mousemove',function(e){
    tt.style.left=(e.clientX+10)+'px';tt.style.top=(e.clientY-28)+'px';
  });
  el.addEventListener('mouseleave',function(){tt.style.display='none';});
  el.style.cursor='pointer';
  el.addEventListener('click',function(){
    var info=this.textContent+'\n참여 인원: '+Math.floor(Math.random()*5+2)+'명\n장소: '+['A회의실','B회의실','화상회의'][Math.floor(Math.random()*3)];
    alert(info);
  });
});

// ── 소통허브 아이템 클릭 ──
document.querySelectorAll('.card .extitem, .card [style*="card2"]').forEach(function(el){
  if(el.querySelector('.extorg')){
    el.style.cursor='pointer';
    el.addEventListener('click',function(){
      var org=this.querySelector('.extorg');
      if(org)org.style.color='var(--grn)';
    });
  }
});

// ── SWOT 항목 클릭 토글 강조 ──
document.querySelectorAll('[style*="border-radius:7px"][style*="padding:9px"]').forEach(function(el){
  el.style.cursor='pointer';
  el.style.transition='transform .15s, box-shadow .15s';
  el.addEventListener('click',function(){
    this.style.transform=this.style.transform?'':'scale(1.02)';
    this.style.boxShadow=this.style.boxShadow?'':'0 4px 16px rgba(0,0,0,.3)';
  });
});
var curTab='ai',savedKey='',hist=[];
var SP={
  ai:'당신은 행정업무 통합 대시보드의 업무 AI 어시스턴트입니다. 회사 일반 행정업무(문서 결재, 회의 관리, 비품 관리, 보고서 작성, 일정 관리 등)를 전문적으로 도와주세요. 항상 실용적이고 간결하게 한국어로만 답변하세요.',
  law:'당신은 행정업무를 위한 AI 법무 어시스턴트입니다. 근로기준법, 계약서 검토, 행정 관련 법령 등을 쉽게 설명해주세요. 한국어로만 답변하고 중요한 사항은 반드시 전문가 상담을 권장하세요.'
};

document.getElementById('apisave').addEventListener('click',function(){
  var k=document.getElementById('apikey').value.trim();
  if(k.startsWith('sk-ant-')){
    savedKey=k;
    document.getElementById('apikey').value='';
    document.getElementById('apikey').placeholder='✓ API Key 저장됨';
    document.getElementById('apikey').disabled=true;
    document.getElementById('apisave').textContent='✓';
    document.getElementById('apisave').style.color='var(--grn)';
  } else {
    document.getElementById('apikey').style.borderColor='var(--red)';
    setTimeout(function(){document.getElementById('apikey').style.borderColor='';},1500);
  }
});

document.getElementById('ctabs').addEventListener('click',function(e){
  var btn=e.target.closest('.ctab');if(!btn)return;
  curTab=btn.dataset.tab;hist=[];
  document.querySelectorAll('.ctab').forEach(function(t){t.classList.remove('a');});
  btn.classList.add('a');
  document.getElementById('cmod').textContent=curTab==='ai'?'업무 모드':'법무 모드';
  document.getElementById('msgs').innerHTML='<div class="msg ai">'+(curTab==='ai'?'안녕하세요! 업무 AI 어시스턴트입니다 🌸<br>결재, 회의, 문서, 연차, 법인카드 등을 도와드립니다.':'안녕하세요! AI 법무 어시스턴트입니다 ⚖️<br>근로기준법, 계약서, 해고 등 법률 정보를 안내해드립니다.')+'</div>';
});

async function doChat(){
  var ci=document.getElementById('cinput');
  if(!ci.value.trim())return;
  if(!savedKey){
    var m2=document.getElementById('msgs');
    m2.innerHTML+='<div class="msg ai" style="color:var(--yel)">⚠️ 위에 API Key를 입력하고 저장해주세요.</div>';
    m2.scrollTop=99999;return;
  }
  var txt=ci.value.trim();ci.value='';
  var m=document.getElementById('msgs');
  m.innerHTML+='<div class="msg u">'+txt.replace(/</g,'&lt;')+'</div>';
  var tid='t'+Date.now();
  m.innerHTML+='<div class="msg ai typing" id="'+tid+'"><span></span><span></span><span></span></div>';
  m.scrollTop=99999;
  hist.push({role:'user',content:txt});
  try{
    var r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':savedKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:SP[curTab],messages:hist})
    });
    var data=await r.json();
    if(data.error){throw new Error(data.error.message);}
    var rep=(data.content&&data.content[0]&&data.content[0].text)||'응답 오류';
    hist.push({role:'assistant',content:rep});
    var el=document.getElementById(tid);if(el)el.remove();
    m.innerHTML+='<div class="msg ai">'+rep.replace(/\n/g,'<br>').replace(/</g,'&lt;')+'</div>';
  }catch(e){
    var el2=document.getElementById(tid);if(el2)el2.remove();
    m.innerHTML+='<div class="msg ai" style="color:var(--yel)">⚠️ '+e.message+'</div>';
  }
  m.scrollTop=99999;
}
document.getElementById('csend').addEventListener('click',doChat);
document.getElementById('cinput').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doChat();}});