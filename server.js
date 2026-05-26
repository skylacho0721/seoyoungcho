require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const passport   = require('passport');
const Google     = require('passport-google-oauth20').Strategy;
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');
const fetch      = require('node-fetch');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

// ── 미들웨어 ──────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dashboard-hankuk-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// ── 인메모리 저장소 ──────────────────────────
const users      = {};
const chatMsgs   = [];
const postits    = [];
const tasks      = {};
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'skylacho0721@gmail.com';

// ── Google OAuth ──────────────────────────
passport.use(new Google({
  clientID:     process.env.GOOGLE_CLIENT_ID     || 'GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET',
  callbackURL:  process.env.CALLBACK_URL         || `http://localhost:${PORT}/auth/google/callback`
}, (at, rt, profile, done) => {
  const user = {
    id:    profile.id,
    name:  profile.displayName,
    email: profile.emails[0].value,
    photo: profile.photos[0]?.value || null,
    role:  profile.emails[0].value === ADMIN_EMAIL ? 'admin' : 'member'
  };
  users[user.id] = user;
  return done(null, user);
}));
passport.serializeUser((u, done)   => done(null, u.id));
passport.deserializeUser((id, done) => done(null, users[id] || null));

// ── Auth middleware ───────────────────────
const auth  = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/login');
const admin = (req, res, next) => (req.isAuthenticated() && req.user.role === 'admin') ? next() : res.status(403).json({ error: '관리자 권한 필요' });

// ── 페이지 라우트 ─────────────────────────
app.get('/',      auth, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ── Google OAuth 라우트 ───────────────────
app.get('/auth/google',          passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => res.redirect('/'));
app.get('/auth/demo', (req, res) => {
  const demo = { id: 'demo', name: '조서영', email: ADMIN_EMAIL, photo: null, role: 'admin' };
  users['demo'] = demo;
  req.login(demo, () => res.redirect('/'));
});
app.get('/logout', (req, res) => req.logout(() => res.redirect('/login')));

// ── API ───────────────────────────────────
app.get('/api/me', auth, (req, res) => res.json(req.user));

// Claude API 프록시 (API 키 서버에서 관리 - 클라이언트에 노출 안됨)
app.post('/api/claude', auth, async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(req.body)
    });
    res.json(await r.json());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 포스트잇
app.get('/api/postits',     auth, (req, res) => res.json(postits));
app.post('/api/postits',    auth, (req, res) => {
  const p = { id: Date.now(), text: req.body.text, color: req.body.color || '#f2a7be', author: req.user.name, createdAt: new Date().toISOString() };
  postits.push(p);
  io.emit('postit-added', p);
  res.json(p);
});
app.delete('/api/postits/:id', auth, (req, res) => {
  const i = postits.findIndex(p => p.id == req.params.id);
  if (i !== -1) { postits.splice(i, 1); io.emit('postit-deleted', req.params.id); }
  res.json({ ok: true });
});

// 팀 업무분장
app.get('/api/tasks',      auth, (req, res) => res.json(tasks));
app.post('/api/tasks',     admin, (req, res) => {
  const { assignee, title, dday, tag } = req.body;
  if (!tasks[assignee]) tasks[assignee] = [];
  const t = { id: Date.now(), title, dday: dday || 'D-?', tag: tag || '일반', done: false, assignedBy: req.user.name };
  tasks[assignee].push(t);
  io.emit('task-assigned', { assignee, task: t });
  res.json(t);
});

// 채팅 기록
app.get('/api/chat', auth, (req, res) => res.json(chatMsgs.slice(-50)));

// ── Socket.io ─────────────────────────────
io.on('connection', socket => {
  socket.on('join', user => { socket.userData = user; });

  socket.on('chat-message', data => {
    const msg = { id: Date.now(), text: data.text, author: data.author, photo: data.photo, role: data.role, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) };
    chatMsgs.push(msg);
    if (chatMsgs.length > 200) chatMsgs.shift();
    io.emit('chat-message', msg);
  });

  socket.on('typing', data => socket.broadcast.emit('typing', data));
});

// ── 서버 시작 ─────────────────────────────
server.listen(PORT, () => console.log(`✅ 대시보드 서버: http://localhost:${PORT}`));
