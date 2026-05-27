// ── CONFIG ──────────────────────────────────────────────────
// En local apunta al backend en :8000; en producción usa la misma URL
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : '';

// ── ESTADO GLOBAL ───────────────────────────────────────────
const state = {
  token: localStorage.getItem('ft_token'),
  user:  JSON.parse(localStorage.getItem('ft_user') || 'null'),
  selectedDate: new Date(),
  classes: [],
  currentClassId: null,
};

// ── API HELPER ───────────────────────────────────────────────
async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { logout(); return null; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error en la solicitud');
  }
  return res.status === 204 ? null : res.json();
}

async function apiForm(path, formData) {
  const res = await fetch(API + path, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error');
  }
  return res.json();
}

// ── TOAST ────────────────────────────────────────────────────
function toast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ── ROUTER ──────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) { screen.classList.add('active'); screen.scrollTop = 0; }
}

// ── AUTH ────────────────────────────────────────────────────
function saveSession(data) {
  state.token = data.access_token;
  state.user  = data.user;
  localStorage.setItem('ft_token', data.access_token);
  localStorage.setItem('ft_user', JSON.stringify(data.user));
}

function logout() {
  state.token = null; state.user = null;
  localStorage.removeItem('ft_token');
  localStorage.removeItem('ft_user');
  showScreen('screen-login');
}

// ── UTILIDADES ───────────────────────────────────────────────
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
}
function fmtDateShort(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}
const AVATAR_COLORS = ['#E53935','#1565C0','#2E7D32','#6A1B9A','#00695C','#E65100','#37474F'];
function avatarColor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function capacityClass(used, max) {
  const pct = used / max;
  if (pct >= 1) return 'full';
  if (pct < 0.4) return 'low';
  return '';
}

function membershipLabel(type) {
  return { monthly: 'Mensualidad', bono: 'Bono', single: 'Clase suelta' }[type] || type;
}

// ─────────────────────────────────────────────────────────────
// ██████╗  ██████╗  ██████╗ ████████╗
// ██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝
// ██████╔╝██║   ██║██║   ██║   ██║
// ██╔══██╗██║   ██║██║   ██║   ██║
// ██║  ██║╚██████╔╝╚██████╔╝   ██║
// ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝
// ─────────────────────────────────────────────────────────────

// ── LOGIN ────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');
  btn.textContent = 'Entrando...';
  try {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    const data = await apiForm('/auth/login', form);
    saveSession(data);
    boot();
  } catch (err) {
    errEl.textContent = err.message;
    btn.textContent = 'Entrar';
  }
});

// ── BOOT — decide qué mostrar al arrancar ────────────────────
function boot() {
  if (!state.token || !state.user) {
    showScreen('screen-login');
    return;
  }
  if (state.user.role === 'trainer') {
    bootTrainer();
  } else {
    bootStudent();
  }
}

// ─────────────────────────────────────────────────────────────
// ENTRENADOR
// ─────────────────────────────────────────────────────────────

function bootTrainer() {
  // Mostrar nav de entrenador, ocultar el de alumno
  document.getElementById('nav-trainer').style.display = 'flex';
  document.getElementById('nav-student').style.display = 'none';
  // Avatar
  document.querySelectorAll('.trainer-avatar').forEach(el => {
    el.textContent = initials(state.user.name);
  });
  loadTrainerDashboard();
  setupTrainerNav();
}

// ── DASHBOARD ENTRENADOR ─────────────────────────────────────
async function loadTrainerDashboard() {
  showScreen('screen-trainer-home');
  const greeting = document.getElementById('trainer-greeting');
  const firstName = state.user.name.split(' ')[0];
  greeting.querySelector('.name').textContent = `${firstName} 👋`;

  buildDateStrip('trainer-date-strip', (d) => {
    state.selectedDate = d;
    loadClassesForDate(d);
  });
  await loadClassesForDate(state.selectedDate);
}

function buildDateStrip(containerId, onSelect) {
  const strip = document.getElementById(containerId);
  strip.innerHTML = '';
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const chip = document.createElement('div');
    chip.className = 'date-chip' + (i === 0 ? ' active' : '');
    chip.innerHTML = `<span>${days[d.getDay()]}</span><br><small>${d.getDate()}</small>`;
    chip.style.textAlign = 'center';
    chip.style.lineHeight = '1.2';
    chip.addEventListener('click', () => {
      strip.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      onSelect(d);
    });
    strip.appendChild(chip);
  }
}

async function loadClassesForDate(date) {
  const list = document.getElementById('trainer-class-list');
  const stats = document.getElementById('trainer-stats');
  list.innerHTML = `<div class="loading">⏳ ${t('general.loading')}</div>`;

  const from = date.toISOString().split('T')[0];
  const to   = from;
  try {
    const classes = await api('GET', `/classes?from_date=${from}&to_date=${to}`);
    state.classes = classes || [];

    // Stats
    const totalSpots = state.classes.reduce((s,c) => s + c.confirmed_spots, 0);
    stats.innerHTML = `
      <div class="stat-box">
        <div class="stat-val">${state.classes.length}<small> clases</small></div>
        <div class="stat-lbl">Hoy</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${totalSpots}<small> alumn.</small></div>
        <div class="stat-lbl">Total hoy</div>
      </div>`;

    if (state.classes.length === 0) {
      list.innerHTML = `<div class="empty"><span class="emoji">📅</span>No hay clases este día.<br>Pulsa + para crear una.</div>`;
      return;
    }

    list.innerHTML = state.classes.map(cls => {
      const pct = Math.round((cls.confirmed_spots / cls.max_spots) * 100);
      const capClass = capacityClass(cls.confirmed_spots, cls.max_spots);
      const pill = cls.is_full
        ? `<span class="pill pill-red">Completa</span>`
        : cls.confirmed_spots === 0
          ? `<span class="pill pill-grey">Sin reservas</span>`
          : `<span class="pill pill-green">${cls.available_spots} plazas libres</span>`;
      return `
        <div class="class-card" onclick="openClassDetail(${cls.id})">
          <div class="class-card-header">
            <div class="class-time">${fmtTime(cls.starts_at)}</div>
            <div class="class-spots">
              <div class="spots-num">${cls.confirmed_spots}/${cls.max_spots}</div>
              <div class="spots-lbl">plazas</div>
            </div>
          </div>
          <div class="class-location">📍 ${cls.location}</div>
          <div class="capacity-bar"><div class="capacity-fill ${capClass}" style="width:${pct}%"></div></div>
          ${pill}
        </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty"><span class="emoji">⚠️</span>${err.message}</div>`;
  }
}

// ── DETALLE DE CLASE (entrenador) ────────────────────────────
async function openClassDetail(classId) {
  state.currentClassId = classId;
  showScreen('screen-class-detail');
  const container = document.getElementById('class-detail-content');
  container.innerHTML = `<div class="loading">⏳ ${t('general.loading')}</div>`;

  try {
    const cls = await api('GET', `/classes/${classId}`);
    const pct = Math.round((cls.confirmed_spots / cls.max_spots) * 100);
    const capClass = capacityClass(cls.confirmed_spots, cls.max_spots);

    const studentsHtml = cls.bookings.length === 0
      ? `<div class="empty"><span class="emoji">👥</span>Ningún alumno apuntado</div>`
      : cls.bookings.map(b => `
          <div class="student-row">
            <div class="student-avatar" style="background:${avatarColor(b.student_id)}">
              ${initials(b.student.name)}
            </div>
            <div class="student-info">
              <div class="student-name">${b.student.name}</div>
              <div class="student-sub">${b.membership_summary || ''}</div>
            </div>
            ${b.membership_summary?.includes('pendiente')
              ? `<span class="pill pill-red">€ pdte</span>`
              : b.membership_summary?.includes('restantes') && parseInt(b.membership_summary) <= 2
                ? `<span class="pill pill-amber">⚠ bajo</span>`
                : `<span class="pill pill-green">✓</span>`}
          </div>`).join('');

    container.innerHTML = `
      <div class="class-card" style="background:#1f0f00;border-color:#3d1f00;">
        <div class="class-card-header">
          <div class="class-time" style="font-size:44px;">${fmtTime(cls.starts_at)}</div>
          <div class="class-spots">
            <div class="spots-num">${cls.confirmed_spots}/${cls.max_spots}</div>
            <div class="spots-lbl">plazas</div>
          </div>
        </div>
        <div class="class-location">📍 ${cls.location} · ${fmtDate(cls.starts_at)}</div>
        <div class="capacity-bar"><div class="capacity-fill ${capClass}" style="width:${pct}%"></div></div>
      </div>

      <div class="s-label">Alumnos apuntados (${cls.confirmed_spots})</div>
      ${studentsHtml}

      <div class="btn-row" style="margin-top:8px;">
        <button class="btn btn-danger" onclick="confirmCancelClass(${cls.id})">Cancelar clase</button>
        <button class="btn btn-primary" onclick="openEditClassModal(${cls.id})">Editar</button>
      </div>`;

    document.getElementById('class-detail-title').textContent = `Clase ${fmtTime(cls.starts_at)}`;
  } catch (err) {
    container.innerHTML = `<div class="empty">⚠️ ${err.message}</div>`;
  }
}

async function confirmCancelClass(classId) {
  if (!confirm('¿Cancelar esta clase? Se notificará a todos los alumnos.')) return;
  try {
    await api('DELETE', `/classes/${classId}`);
    toast(t('general.class_cancelled'));
    loadTrainerDashboard();
  } catch (err) {
    toast('⚠️ ' + err.message);
  }
}

// ── NUEVA CLASE ──────────────────────────────────────────────
let newClassSpots = 10;

function openNewClass() {
  newClassSpots = 10;
  document.getElementById('nc-spots-val').textContent = '10';
  // Prellenar fecha con la seleccionada
  const d = state.selectedDate;
  const fmt = d.toISOString().slice(0,10);
  document.getElementById('nc-date').value = fmt;
  document.getElementById('nc-time-start').value = '09:00';
  document.getElementById('nc-time-end').value = '10:00';
  document.getElementById('nc-location').value = '';
  document.getElementById('nc-type').value = 'Funcional';
  showScreen('screen-new-class');
}

document.getElementById('nc-spots-minus').addEventListener('click', () => {
  if (newClassSpots > 1) { newClassSpots--; document.getElementById('nc-spots-val').textContent = newClassSpots; }
});
document.getElementById('nc-spots-plus').addEventListener('click', () => {
  if (newClassSpots < 20) { newClassSpots++; document.getElementById('nc-spots-val').textContent = newClassSpots; }
});

document.getElementById('new-class-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const date  = document.getElementById('nc-date').value;
  const start = document.getElementById('nc-time-start').value;
  const end   = document.getElementById('nc-time-end').value;
  const loc   = document.getElementById('nc-location').value;
  const type  = document.getElementById('nc-type').value;

  const btn = document.getElementById('nc-submit');
  btn.textContent = 'Creando...';
  try {
    await api('POST', '/classes', {
      starts_at: `${date}T${start}:00`,
      ends_at:   `${date}T${end}:00`,
      location:  loc,
      max_spots: newClassSpots,
      type:      type,
    });
    toast(t('general.class_created'));
    loadTrainerDashboard();
  } catch (err) {
    toast('⚠️ ' + err.message);
    btn.textContent = 'Crear clase';
  }
});

// ── ALUMNOS ──────────────────────────────────────────────────
async function loadStudents() {
  showScreen('screen-students');
  const list = document.getElementById('students-list');
  list.innerHTML = `<div class="loading">⏳ ${t('general.loading')}</div>`;
  try {
    const [students, memberships] = await Promise.all([
      api('GET', '/students'),
      api('GET', '/memberships'),
    ]);
    // Agrupar membresías por alumno
    const memByStudent = {};
    (memberships || []).forEach(m => { memByStudent[m.student_id] = m; });

    // Alumnos con pago pendiente arriba
    const pending = students.filter(s => memByStudent[s.id] && !memByStudent[s.id].is_paid);
    const ok      = students.filter(s => !pending.includes(s));

    const header = document.getElementById('students-header');
    header.textContent = `${students.length} alumnos activos`;

    const alertEl = document.getElementById('students-alert');
    if (pending.length > 0) {
      alertEl.innerHTML = `<span>⚠️</span><span class="alert-text">${pending.length} alumno${pending.length > 1 ? 's' : ''} con pago pendiente</span>`;
      alertEl.style.display = 'flex';
    } else {
      alertEl.style.display = 'none';
    }

    const LEVEL_LABELS = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };
    const LEVEL_PILLS  = { principiante: 'pill-green', intermedio: 'pill-amber', avanzado: 'pill-orange' };

    const renderStudent = (s) => {
      const mem = memByStudent[s.id];
      const memText = mem
        ? `${membershipLabel(mem.type)}${mem.type === 'bono' ? ` · ${mem.remaining_classes} restantes` : ''}`
        : 'Sin membresía';
      const levelText = s.fitness_level ? LEVEL_LABELS[s.fitness_level] : '';
      const ageText   = s.age ? `${s.age} años` : '';
      const sub = [levelText, ageText, memText].filter(Boolean).join(' · ');

      const badge = !mem ? `<span class="pill pill-grey">-</span>`
        : !mem.is_paid ? `<span class="pill pill-red">€ pdte</span>`
        : mem.is_low ? `<span class="pill pill-amber">⚠ ${mem.remaining_classes}</span>`
        : `<span class="pill pill-green">✓</span>`;
      return `<div class="student-row" onclick="openStudentDetail(${s.id})">
        <div class="student-avatar" style="background:${avatarColor(s.id)}">${initials(s.name)}</div>
        <div class="student-info">
          <div class="student-name">${s.name}</div>
          <div class="student-sub">${sub}</div>
        </div>
        ${badge}
      </div>`;
    };

    list.innerHTML = [...pending, ...ok].map(renderStudent).join('') ||
      `<div class="empty"><span class="emoji">👥</span>Aún no tienes alumnos.<br>Genera un enlace de invitación.</div>`;
  } catch (err) {
    list.innerHTML = `<div class="empty">⚠️ ${err.message}</div>`;
  }
}

async function openStudentDetail(studentId) {
  // Abre modal con info del alumno
  try {
    const [student, memberships] = await Promise.all([
      api('GET', `/students/${studentId}`),
      api('GET', '/memberships'),
    ]);
    const mem = memberships?.find(m => m.student_id === studentId);
    openStudentModal(student, mem);
  } catch (err) {
    toast('⚠️ ' + err.message);
  }
}

const LEVEL_LABELS = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };

function openStudentModal(student, mem) {
  document.getElementById('modal-student-name').textContent  = student.name;
  document.getElementById('modal-student-email').textContent = student.email;
  document.getElementById('modal-student-avatar').textContent = initials(student.name);
  document.getElementById('modal-student-avatar').style.background = avatarColor(student.id);

  const infoEl = document.getElementById('modal-student-info');

  // Chips de nivel y edad
  const levelChip = student.fitness_level
    ? `<span class="pill pill-orange">${LEVEL_LABELS[student.fitness_level]}</span>` : '';
  const ageChip = student.age
    ? `<span class="pill pill-grey">${student.age} años</span>` : '';

  // Membresía
  let memHtml = '';
  if (mem) {
    memHtml = `
      <div class="bono-card" style="margin-top:4px;">
        <div>
          <div class="bono-label">Plan actual</div>
          <div class="bono-type">${membershipLabel(mem.type)}</div>
          <div style="margin-top:8px;">
            <span class="pill ${mem.is_paid ? 'pill-green' : 'pill-red'}">${mem.is_paid ? '✓ Pagado' : '€ Pendiente'}</span>
          </div>
        </div>
        <div>
          <div class="bono-count">${mem.type === 'bono' ? mem.remaining_classes : '∞'}</div>
          <div class="bono-of">${mem.type === 'bono' ? `de ${mem.total_classes}` : 'mensual'}</div>
        </div>
      </div>
      ${!mem.is_paid ? `<button class="btn btn-primary" onclick="markPaid(${mem.id})">✓ Marcar como pagado</button>` : ''}
      <button class="btn btn-outline" onclick="sendPaymentReminder(${student.id}, '${student.name}')">Enviar recordatorio de pago</button>`;
  } else {
    memHtml = `<div class="empty" style="padding:16px 0;"><span class="emoji">💳</span>Sin membresía asignada</div>`;
  }

  // Notas del entrenador
  const notesHtml = `
    <div class="form-group">
      <label class="form-label">Notas del entrenador</label>
      <textarea id="modal-student-notes" class="form-input" rows="2" placeholder="Lesiones, objetivos, observaciones..."
        style="resize:none;">${student.notes || ''}</textarea>
    </div>
    <button class="btn btn-outline" onclick="saveStudentNotes(${student.id})">Guardar notas</button>`;

  infoEl.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;">${levelChip}${ageChip}</div>
    ${memHtml}
    ${notesHtml}
  `;

  openModal('modal-student');
}

async function saveStudentNotes(studentId) {
  const notes = document.getElementById('modal-student-notes').value;
  try {
    await api('PUT', `/students/${studentId}`, { notes });
    toast(t('general.notes_saved'));
  } catch (err) { toast('⚠️ ' + err.message); }
}

async function markPaid(memId) {
  try {
    await api('POST', `/memberships/${memId}/paid`);
    toast(t('general.marked_paid'));
    closeModal('modal-student');
    loadStudents();
  } catch (err) { toast('⚠️ ' + err.message); }
}

async function sendPaymentReminder(studentId, name) {
  try {
    await api('POST', `/notify/payment/${studentId}`);
    toast(`📧 Recordatorio enviado a ${name}`);
  } catch (err) { toast('⚠️ ' + err.message); }
}

// ── INVITACIÓN ───────────────────────────────────────────────
function makeQR(elId, url) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = '';
  new QRCode(el, { text: url, width: 180, height: 180,
    colorDark: '#0A0A0A', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M });
}

function switchInviteTab(tab) {
  const isLanding = tab === 'landing';
  document.getElementById('panel-landing').style.display = isLanding ? 'flex' : 'none';
  document.getElementById('panel-landing').style.flexDirection = 'column';
  document.getElementById('panel-landing').style.gap = '12px';
  document.getElementById('panel-invite').style.display  = isLanding ? 'none' : 'flex';
  document.getElementById('panel-invite').style.flexDirection = 'column';
  document.getElementById('panel-invite').style.gap = '12px';
  document.getElementById('tab-landing').style.background = isLanding ? 'var(--orange)' : 'transparent';
  document.getElementById('tab-landing').style.color      = isLanding ? '#fff' : 'var(--muted)';
  document.getElementById('tab-invite').style.background  = isLanding ? 'transparent' : 'var(--orange)';
  document.getElementById('tab-invite').style.color       = isLanding ? 'var(--muted)' : '#fff';
}
window.switchInviteTab = switchInviteTab;

async function generateInvite() {
  try {
    const data = await api('POST', '/invite/generate');
    openModal('modal-invite');
    switchInviteTab('landing');

    // QR landing (página pública)
    document.getElementById('landing-url').textContent = data.landing_url;
    makeQR('landing-qr', data.landing_url);

    // QR registro directo
    document.getElementById('invite-url').textContent = data.invite_url;
    makeQR('invite-qr', data.invite_url);
  } catch (err) { toast('⚠️ ' + err.message); }
}

// ── NAV ENTRENADOR ───────────────────────────────────────────
function setupTrainerNav() {
  document.getElementById('tn-home').addEventListener('click', loadTrainerDashboard);
  document.getElementById('tn-students').addEventListener('click', loadStudents);
  document.getElementById('tn-add').addEventListener('click', openNewClass);
  document.getElementById('tn-invite').addEventListener('click', generateInvite);
}


// ─────────────────────────────────────────────────────────────
// ALUMNO
// ─────────────────────────────────────────────────────────────

function bootStudent() {
  document.getElementById('nav-trainer').style.display = 'none';
  document.getElementById('nav-student').style.display = 'flex';
  document.querySelectorAll('.student-avatar-btn').forEach(el => {
    el.textContent = initials(state.user.name);
  });
  loadStudentHome();
  setupStudentNav();
}

// ── HOME ALUMNO ──────────────────────────────────────────────
async function loadStudentHome() {
  showScreen('screen-student-home');
  const firstName = state.user.name.split(' ')[0];
  document.getElementById('student-greeting').querySelector('.name').textContent = `${firstName} 🔥`;

  // Cargar bono
  loadStudentBono();

  buildDateStrip('student-date-strip', (d) => {
    state.selectedDate = d;
    loadStudentClasses(d);
  });
  await loadStudentClasses(state.selectedDate);
}

async function loadStudentBono() {
  try {
    const mem = await api('GET', '/memberships/my');
    const bonoEl = document.getElementById('student-bono');
    if (!mem) { bonoEl.style.display = 'none'; return; }

    let countHtml = '';
    let ofHtml = '';
    let dotsHtml = '';
    if (mem.type === 'monthly') {
      countHtml = '∞';
      ofHtml = 'Ilimitado';
    } else {
      countHtml = mem.remaining_classes;
      ofHtml = `de ${mem.total_classes}`;
      const dots = Array.from({length: mem.total_classes}, (_, i) =>
        `<div class="bono-dot ${i >= mem.remaining_classes ? 'used' : ''}"></div>`
      ).join('');
      dotsHtml = `<div class="bono-dots">${dots}</div>`;
    }
    bonoEl.innerHTML = `
      <div class="bono-card">
        <div>
          <div class="bono-label">Tu plan</div>
          <div class="bono-type">${membershipLabel(mem.type)}</div>
          ${dotsHtml}
        </div>
        <div>
          <div class="bono-count">${countHtml}</div>
          <div class="bono-of">${ofHtml}</div>
        </div>
      </div>`;
  } catch {
    document.getElementById('student-bono').innerHTML = '';
  }
}

async function loadStudentClasses(date) {
  const list = document.getElementById('student-class-list');
  list.innerHTML = `<div class="loading">⏳ ${t('general.loading')}</div>`;
  const from = date.toISOString().split('T')[0];
  try {
    const [classes, myBookings] = await Promise.all([
      api('GET', `/classes?from_date=${from}&to_date=${from}`),
      api('GET', '/bookings/my'),
    ]);
    const bookedClassIds = new Set((myBookings || []).map(b => b.class_id));

    if (!classes || classes.length === 0) {
      list.innerHTML = `<div class="empty"><span class="emoji">🗓️</span>No hay clases disponibles este día.</div>`;
      return;
    }

    list.innerHTML = classes.map(cls => {
      const booked = bookedClassIds.has(cls.id);
      const full   = cls.is_full && !booked;
      return `
        <div class="class-card-student">
          <div class="class-card-accent ${full ? 'grey' : ''}"></div>
          <div class="class-card-body">
            <div class="class-meta">
              <span class="class-type">${cls.type}</span>
              ${booked
                ? `<span class="pill pill-orange">${t('student.reserved')}</span>`
                : full
                  ? `<span class="pill pill-red">${t('student.full')}</span>`
                  : `<span class="pill pill-green">${cls.available_spots} ${t('student.free_spots')}</span>`}
            </div>
            <div class="class-info-row">
              <div class="class-hour ${full && !booked ? 'dim' : ''}">${fmtTime(cls.starts_at)}</div>
              <div class="class-sub">📍 ${cls.location}<br>${cls.confirmed_spots}/${cls.max_spots}</div>
            </div>
            ${booked
              ? `<button class="btn btn-outline" onclick="cancelMyBooking(${cls.id})">${t('bookings.cancel')}</button>`
              : full
                ? `<button class="btn btn-outline" onclick="joinWaitlist(${cls.id})">${t('student.waitlist')}</button>`
                : `<button class="btn btn-primary" onclick="bookClass(${cls.id})">${t('student.reserve')}</button>`}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty">⚠️ ${err.message}</div>`;
  }
}

async function bookClass(classId) {
  try {
    await api('POST', '/bookings', { class_id: classId });
    toast(t('general.booked'));
    loadStudentClasses(state.selectedDate);
    loadStudentBono();
  } catch (err) { toast('⚠️ ' + err.message); }
}

async function joinWaitlist(classId) {
  try {
    await api('POST', '/bookings', { class_id: classId });
    toast(t('general.waitlisted'));
    loadStudentClasses(state.selectedDate);
  } catch (err) { toast('⚠️ ' + err.message); }
}

async function cancelMyBooking(classId) {
  if (!confirm('¿Cancelar esta reserva?')) return;
  try {
    const bookings = await api('GET', '/bookings/my');
    const booking  = bookings.find(b => b.class_id === classId);
    if (!booking) { toast('No se encontró la reserva'); return; }
    await api('DELETE', `/bookings/${booking.id}`);
    toast('Reserva cancelada');
    loadStudentClasses(state.selectedDate);
    loadStudentBono();
  } catch (err) { toast('⚠️ ' + err.message); }
}

// ── MIS RESERVAS ─────────────────────────────────────────────
async function loadMyBookings() {
  showScreen('screen-my-bookings');
  const list = document.getElementById('my-bookings-list');
  list.innerHTML = `<div class="loading">⏳ ${t('general.loading')}</div>`;
  try {
    const bookings = await api('GET', '/bookings/my');
    const now = new Date();
    const upcoming = (bookings || []).filter(b => new Date(b.class_?.starts_at) > now);
    const past     = (bookings || []).filter(b => new Date(b.class_?.starts_at) <= now);

    const renderBooking = (b, isPast) => {
      const cls = b.class_;
      if (!cls) return '';
      return `
        <div class="reserved-card" style="${isPast ? 'opacity:.5' : ''}">
          <div>
            <div class="reserved-date">${fmtDateShort(cls.starts_at)}</div>
            <div class="reserved-time">${fmtTime(cls.starts_at)}</div>
            <div class="reserved-loc">📍 ${cls.location}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            ${isPast
              ? `<span class="pill pill-grey">Asistida</span>`
              : `<span class="pill pill-orange">Confirmada</span>
                 <button class="cancel-x" onclick="cancelMyBooking(${cls.id})">✕</button>`}
          </div>
        </div>`;
    };

    list.innerHTML = `
      <div class="s-label">Próximas (${upcoming.length})</div>
      ${upcoming.length ? upcoming.map(b => renderBooking(b, false)).join('') : '<div class="empty" style="padding:20px 0"><span class="emoji">📅</span>Sin reservas próximas</div>'}
      <div class="s-label" style="margin-top:8px;">Historial</div>
      ${past.length ? past.map(b => renderBooking(b, true)).join('') : '<div class="empty" style="padding:20px 0;font-size:12px;">Sin historial aún</div>'}
    `;
  } catch (err) {
    list.innerHTML = `<div class="empty">⚠️ ${err.message}</div>`;
  }
}

// ── MI PERFIL ────────────────────────────────────────────────
async function loadProfile() {
  showScreen('screen-profile');
  document.getElementById('profile-avatar').textContent = initials(state.user.name);
  document.getElementById('profile-avatar').style.background = avatarColor(state.user.id);
  document.getElementById('profile-name').textContent  = state.user.name;
  document.getElementById('profile-email').textContent = state.user.email;

  // Bono
  try {
    const mem = await api('GET', '/memberships/my');
    const bonoEl = document.getElementById('profile-bono');
    if (mem) {
      const dots = mem.type === 'bono'
        ? `<div class="bono-dots">${Array.from({length: mem.total_classes}, (_,i) =>
            `<div class="bono-dot ${i >= mem.remaining_classes ? 'used' : ''}"></div>`).join('')}</div>` : '';
      bonoEl.innerHTML = `
        <div class="bono-card">
          <div>
            <div class="bono-label">Tu plan actual</div>
            <div class="bono-type">${membershipLabel(mem.type)}</div>
            ${dots}
          </div>
          <div>
            <div class="bono-count">${mem.type === 'monthly' ? '∞' : mem.remaining_classes}</div>
            <div class="bono-of">${mem.type === 'bono' ? `de ${mem.total_classes}` : 'ilimitado'}</div>
          </div>
        </div>`;
    }
  } catch { /* sin membresía */ }

  // Stats
  try {
    const bookings = await api('GET', '/bookings/my');
    const total = bookings?.length || 0;
    const now = new Date();
    const thisMonth = (bookings || []).filter(b => {
      const d = new Date(b.class_?.starts_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('profile-stats').innerHTML = `
      <div class="stat-box"><div class="stat-val">${total}</div><div class="stat-lbl">Clases totales</div></div>
      <div class="stat-box"><div class="stat-val">${thisMonth}</div><div class="stat-lbl">Este mes</div></div>`;
  } catch { /* */ }
}

// ── NAV ALUMNO ───────────────────────────────────────────────
function setupStudentNav() {
  document.getElementById('sn-home').addEventListener('click', loadStudentHome);
  document.getElementById('sn-bookings').addEventListener('click', loadMyBookings);
  document.getElementById('sn-profile').addEventListener('click', loadProfile);
}

// ─────────────────────────────────────────────────────────────
// MODALES
// ─────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
// Cierra al tocar fuera
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// Exponer funciones al HTML
window.openClassDetail     = openClassDetail;
window.confirmCancelClass  = confirmCancelClass;
window.openNewClass        = openNewClass;
window.openStudentDetail   = openStudentDetail;
window.markPaid            = markPaid;
window.sendPaymentReminder = sendPaymentReminder;
window.generateInvite      = generateInvite;
window.bookClass           = bookClass;
window.joinWaitlist        = joinWaitlist;
window.cancelMyBooking     = cancelMyBooking;
window.openModal           = openModal;
window.closeModal          = closeModal;
window.logout              = logout;
window.openEditClassModal  = () => toast('Próximamente');
window.saveStudentNotes     = saveStudentNotes;
window.openAssignMembership = () => toast('Próximamente');

// ── REGISTRO VIA ENLACE/QR ──────────────────────────────────
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('register-error');
  const btn   = document.getElementById('register-btn');
  const token = new URLSearchParams(window.location.search).get('token');

  if (!token) {
    errEl.textContent = 'Enlace de invitación no válido. Pide uno nuevo a tu entrenador.';
    return;
  }

  btn.textContent = 'Creando cuenta...';
  try {
    const data = await api('POST', '/auth/register', {
      token,
      name:          document.getElementById('reg-name').value,
      email:         document.getElementById('reg-email').value,
      password:      document.getElementById('reg-password').value,
      age:           parseInt(document.getElementById('reg-age').value),
      fitness_level: document.getElementById('reg-level').value,
    });
    // Login automático tras registro
    const form = new FormData();
    form.append('username', document.getElementById('reg-email').value);
    form.append('password', document.getElementById('reg-password').value);
    const session = await apiForm('/auth/login', form);
    saveSession(session);
    // Limpiar token de la URL
    window.history.replaceState({}, '', '/');
    toast('✅ ¡Bienvenido/a a la tribu! 🔥');
    boot();
  } catch (err) {
    errEl.textContent = err.message;
    btn.textContent = 'Crear cuenta';
  }
});

// ─────────────────────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Aplicar idioma guardado al arrancar
applyTranslations();
updateLangToggle();

// Si hay token en la URL → pantalla de registro
const urlToken = new URLSearchParams(window.location.search).get('token');
if (urlToken) {
  showScreen('screen-register');
} else {
  boot();
}
