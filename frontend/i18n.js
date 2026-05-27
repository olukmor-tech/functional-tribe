// ── SISTEMA DE TRADUCCIÓN — Functional Tribe ─────────────────
// Uso: t('clave') devuelve el texto en el idioma activo
// En HTML: <span data-i18n="clave"></span> → se rellena automático

const TRANSLATIONS = {

  es: {
    // ── LOGIN ──────────────────────────────
    'login.email':       'Email',
    'login.password':    'Contraseña',
    'login.btn':         'Entrar',
    'login.sub':         'Functional',

    // ── REGISTRO ───────────────────────────
    'reg.title':         'Únete a la tribu',
    'reg.name':          'Nombre completo',
    'reg.name.ph':       'Tu nombre',
    'reg.email':         'Email',
    'reg.password':      'Contraseña',
    'reg.password.ph':   'Mínimo 6 caracteres',
    'reg.age':           'Edad',
    'reg.level':         'Nivel',
    'reg.level.select':  'Selecciona...',
    'reg.level.beg':     'Principiante',
    'reg.level.mid':     'Intermedio',
    'reg.level.adv':     'Avanzado',
    'reg.btn':           'Crear cuenta',
    'reg.legal':         'Al registrarte aceptas que tus datos se usen para gestionar tus clases con tu entrenador.',

    // ── NAV ────────────────────────────────
    'nav.today':         'Hoy',
    'nav.students':      'Alumnos',
    'nav.add':           'Nueva',
    'nav.share':         'Compartir',
    'nav.home':          'Inicio',
    'nav.bookings':      'Mis clases',
    'nav.profile':       'Perfil',

    // ── DASHBOARD ENTRENADOR ───────────────
    'trainer.hello':     'Buenos días,',
    'trainer.classes':   'clases',
    'trainer.students':  'alumn.',
    'trainer.today':     'Hoy',
    'trainer.total':     'Total hoy',
    'trainer.day_classes': 'Clases del día',
    'trainer.spots':     'plazas',
    'trainer.full':      'Completa',
    'trainer.no_bookings': 'Sin reservas',
    'trainer.free':      'plazas libres',
    'trainer.no_classes': 'No hay clases este día.\nPulsa + para crear una.',

    // ── DETALLE CLASE ──────────────────────
    'class.students_in': 'Alumnos apuntados',
    'class.cancel':      'Cancelar clase',
    'class.edit':        'Editar',
    'class.notify':      'Avisar grupo',
    'class.confirm_cancel': '¿Cancelar esta clase? Se notificará a todos los alumnos.',

    // ── ALUMNOS ────────────────────────────
    'students.active':   'alumnos activos',
    'students.pending':  'alumno con pago pendiente',
    'students.pendings': 'alumnos con pago pendiente',
    'students.no_mem':   'Sin membresía',
    'students.add':      'Añadir alumno',
    'students.paid':     '✓ Pagado',
    'students.unpaid':   '€ Pendiente',
    'students.mark_paid': '✓ Marcar como pagado',
    'students.send_reminder': 'Enviar recordatorio de pago',
    'students.notes':    'Notas del entrenador',
    'students.notes.ph': 'Lesiones, objetivos, observaciones...',
    'students.save_notes': 'Guardar notas',
    'students.no_students': 'Aún no tienes alumnos.\nGenera un enlace de invitación.',
    'students.no_mem_msg': 'Sin membresía asignada',
    'students.assign_mem': 'Asignar membresía',

    // ── NUEVA CLASE ────────────────────────
    'nc.title':          'Nueva Clase',
    'nc.day':            'Día',
    'nc.start':          'Hora inicio',
    'nc.end':            'Hora fin',
    'nc.location':       'Ubicación',
    'nc.location.ph':    'Ej: Parque del Olivar',
    'nc.type':           'Tipo de entrenamiento',
    'nc.spots':          'Plazas máximas',
    'nc.create':         'Crear clase',
    'nc.cancel':         'Cancelar',
    'nc.draft':          'Guardar como borrador',

    // ── MEMBRESÍAS ─────────────────────────
    'mem.monthly':       'Mensualidad',
    'mem.bono':          'Bono',
    'mem.single':        'Clase suelta',
    'mem.your_plan':     'Tu plan',
    'mem.unlimited':     'Ilimitado',
    'mem.remaining':     'de',
    'mem.current_plan':  'Plan actual',

    // ── ALUMNO: HOME ───────────────────────
    'student.hello':     'Hola,',
    'student.available': 'Clases disponibles',
    'student.reserve':   'Reservar',
    'student.waitlist':  'Lista de espera',
    'student.reserved':  '✓ Reservada',
    'student.full':      'Completa',
    'student.free_spots':'plazas',
    'student.no_classes':'No hay clases disponibles este día.',

    // ── RESERVAS ───────────────────────────
    'bookings.upcoming': 'Próximas',
    'bookings.history':  'Historial',
    'bookings.confirmed':'Confirmada',
    'bookings.attended': 'Asistida',
    'bookings.cancel':   'Cancelar reserva',
    'bookings.no_upcoming': 'Sin reservas próximas',
    'bookings.no_history':  'Sin historial aún',
    'bookings.confirm_cancel': '¿Cancelar esta reserva?',

    // ── PERFIL ─────────────────────────────
    'profile.notifications': 'Notificaciones',
    'profile.reminder':  'Recordatorio 24h antes',
    'profile.bono_warn': 'Aviso bono agotándose',
    'profile.logout':    'Cerrar sesión',
    'profile.total':     'Clases totales',
    'profile.month':     'Este mes',

    // ── COMPARTIR ──────────────────────────
    'share.title':       'Compartir',
    'share.landing_tab': '📱 Landing pública',
    'share.invite_tab':  '🎟️ Alta directa',
    'share.landing_desc':'QR para Instagram, flyers o stories. Lleva a tu página pública con tus redes y el formulario de solicitud.',
    'share.invite_desc': 'Enlace de registro directo. Mándalo por WhatsApp a un alumno concreto. Caduca en 7 días.',
    'share.copy_landing':'Copiar enlace landing',
    'share.copy_invite': 'Copiar enlace de registro',
    'share.close':       'Cerrar',
    'share.expires':     'El enlace caduca en 7 días',
    'share.copied':      '✅ Enlace copiado',

    // ── LANDING ────────────────────────────
    'landing.role':      'Entrenador personal',
    'landing.tagline':   'Entrenamiento funcional en grupo',
    'landing.bio':       'Grupos <strong>reducidos de 8-10 personas</strong> para que cada sesión sea real, intensa y adaptada a ti. Funcional, al aire libre, sin excusas.',
    'landing.spots':     'Plazas máx',
    'landing.sessions':  'Sesiones / sem',
    'landing.levels':    'Niveles',
    'landing.ig_sub':    '@functionaltribe',
    'landing.tik_sub':   '@functionaltribe',
    'landing.wa_name':   'WhatsApp',
    'landing.wa_sub':    'Pregúntame lo que quieras',
    'landing.cta_label': '¿Listo para entrenar?',
    'landing.cta_btn':   'Solicitar plaza →',
    'landing.form_title':'Déjame tus datos 🔥',
    'landing.form_desc': 'Te escribo para contarte horarios, precios y disponibilidad.',
    'landing.req_name':  'Nombre',
    'landing.req_contact': 'Email o teléfono',
    'landing.req_contact_ph': 'tu@email.com o 6XX XXX XXX',
    'landing.req_level': 'Nivel',
    'landing.req_level_default': 'Selecciona tu nivel',
    'landing.req_beg':   'Principiante — empiezo desde cero',
    'landing.req_mid':   'Intermedio — tengo algo de base',
    'landing.req_adv':   'Avanzado — entreno regularmente',
    'landing.req_send':  'Enviar solicitud',
    'landing.success_title': '¡Solicitud enviada!',
    'landing.success_msg': 'Me pondré en contacto contigo en las próximas 24 horas para confirmar tu plaza.',

    // ── GENERAL ────────────────────────────
    'general.back':      '← Volver',
    'general.close':     'Cerrar',
    'general.loading':   'Cargando...',
    'general.error':     'Error al cargar',
    'general.confirm_cancel_class': '¿Cancelar esta clase? Se notificará a todos los alumnos.',
    'general.reminder_sent': 'Recordatorio enviado a',
    'general.notes_saved': '✅ Notas guardadas',
    'general.class_created': '✅ Clase creada',
    'general.class_cancelled': '✅ Clase cancelada — alumnos notificados',
    'general.booked': '✅ Plaza reservada — recibirás confirmación por email',
    'general.waitlisted': '⏳ Añadido a la lista de espera',
    'general.booking_cancelled': 'Reserva cancelada',
    'general.marked_paid': '✅ Marcado como pagado',
    'general.creating': 'Creando...',
    'general.entering': 'Entrando...',
    'general.creating_account': 'Creando cuenta...',
  },

  en: {
    // ── LOGIN ──────────────────────────────
    'login.email':       'Email',
    'login.password':    'Password',
    'login.btn':         'Sign in',
    'login.sub':         'Functional',

    // ── REGISTRO ───────────────────────────
    'reg.title':         'Join the tribe',
    'reg.name':          'Full name',
    'reg.name.ph':       'Your name',
    'reg.email':         'Email',
    'reg.password':      'Password',
    'reg.password.ph':   'At least 6 characters',
    'reg.age':           'Age',
    'reg.level':         'Level',
    'reg.level.select':  'Select...',
    'reg.level.beg':     'Beginner',
    'reg.level.mid':     'Intermediate',
    'reg.level.adv':     'Advanced',
    'reg.btn':           'Create account',
    'reg.legal':         'By signing up you agree to your data being used to manage your training sessions with your coach.',

    // ── NAV ────────────────────────────────
    'nav.today':         'Today',
    'nav.students':      'Members',
    'nav.add':           'New',
    'nav.share':         'Share',
    'nav.home':          'Home',
    'nav.bookings':      'My classes',
    'nav.profile':       'Profile',

    // ── DASHBOARD ENTRENADOR ───────────────
    'trainer.hello':     'Good morning,',
    'trainer.classes':   'classes',
    'trainer.students':  'members',
    'trainer.today':     'Today',
    'trainer.total':     'Total today',
    'trainer.day_classes': 'Today\'s classes',
    'trainer.spots':     'spots',
    'trainer.full':      'Full',
    'trainer.no_bookings': 'No bookings',
    'trainer.free':      'spots available',
    'trainer.no_classes': 'No classes today.\nTap + to create one.',

    // ── DETALLE CLASE ──────────────────────
    'class.students_in': 'Members booked',
    'class.cancel':      'Cancel class',
    'class.edit':        'Edit',
    'class.notify':      'Notify group',
    'class.confirm_cancel': 'Cancel this class? All members will be notified.',

    // ── ALUMNOS ────────────────────────────
    'students.active':   'active members',
    'students.pending':  'member with pending payment',
    'students.pendings': 'members with pending payment',
    'students.no_mem':   'No membership',
    'students.add':      'Add member',
    'students.paid':     '✓ Paid',
    'students.unpaid':   '€ Pending',
    'students.mark_paid': '✓ Mark as paid',
    'students.send_reminder': 'Send payment reminder',
    'students.notes':    'Coach notes',
    'students.notes.ph': 'Injuries, goals, observations...',
    'students.save_notes': 'Save notes',
    'students.no_students': 'No members yet.\nGenerate an invite link.',
    'students.no_mem_msg': 'No membership assigned',
    'students.assign_mem': 'Assign membership',

    // ── NUEVA CLASE ────────────────────────
    'nc.title':          'New Class',
    'nc.day':            'Day',
    'nc.start':          'Start time',
    'nc.end':            'End time',
    'nc.location':       'Location',
    'nc.location.ph':    'E.g. Riverside Park',
    'nc.type':           'Training type',
    'nc.spots':          'Max spots',
    'nc.create':         'Create class',
    'nc.cancel':         'Cancel',
    'nc.draft':          'Save as draft',

    // ── MEMBRESÍAS ─────────────────────────
    'mem.monthly':       'Monthly',
    'mem.bono':          'Class pack',
    'mem.single':        'Drop-in',
    'mem.your_plan':     'Your plan',
    'mem.unlimited':     'Unlimited',
    'mem.remaining':     'of',
    'mem.current_plan':  'Current plan',

    // ── ALUMNO: HOME ───────────────────────
    'student.hello':     'Hey,',
    'student.available': 'Available classes',
    'student.reserve':   'Book',
    'student.waitlist':  'Join waitlist',
    'student.reserved':  '✓ Booked',
    'student.full':      'Full',
    'student.free_spots':'spots',
    'student.no_classes':'No classes available today.',

    // ── RESERVAS ───────────────────────────
    'bookings.upcoming': 'Upcoming',
    'bookings.history':  'History',
    'bookings.confirmed':'Confirmed',
    'bookings.attended': 'Attended',
    'bookings.cancel':   'Cancel booking',
    'bookings.no_upcoming': 'No upcoming bookings',
    'bookings.no_history':  'No history yet',
    'bookings.confirm_cancel': 'Cancel this booking?',

    // ── PERFIL ─────────────────────────────
    'profile.notifications': 'Notifications',
    'profile.reminder':  '24h class reminder',
    'profile.bono_warn': 'Pack running low alert',
    'profile.logout':    'Sign out',
    'profile.total':     'Total classes',
    'profile.month':     'This month',

    // ── COMPARTIR ──────────────────────────
    'share.title':       'Share',
    'share.landing_tab': '📱 Public page',
    'share.invite_tab':  '🎟️ Direct sign-up',
    'share.landing_desc':'QR for Instagram, flyers or stories. Links to your public page with socials and interest form.',
    'share.invite_desc': 'Direct registration link. Send via WhatsApp to a specific member. Expires in 7 days.',
    'share.copy_landing':'Copy landing link',
    'share.copy_invite': 'Copy sign-up link',
    'share.close':       'Close',
    'share.expires':     'Link expires in 7 days',
    'share.copied':      '✅ Link copied',

    // ── LANDING ────────────────────────────
    'landing.role':      'Personal trainer',
    'landing.tagline':   'Functional group training',
    'landing.bio':       'Small groups of <strong>8-10 people</strong> so every session is real, intense and tailored to you. Functional, outdoors, no excuses.',
    'landing.spots':     'Max spots',
    'landing.sessions':  'Sessions / week',
    'landing.levels':    'Levels',
    'landing.ig_sub':    '@functionaltribe',
    'landing.tik_sub':   '@functionaltribe',
    'landing.wa_name':   'WhatsApp',
    'landing.wa_sub':    'Ask me anything',
    'landing.cta_label': 'Ready to train?',
    'landing.cta_btn':   'Request a spot →',
    'landing.form_title':'Leave your details 🔥',
    'landing.form_desc': 'I\'ll get back to you with schedules, pricing and availability.',
    'landing.req_name':  'Name',
    'landing.req_contact': 'Email or phone',
    'landing.req_contact_ph': 'you@email.com or +34 6XX XXX XXX',
    'landing.req_level': 'Level',
    'landing.req_level_default': 'Select your level',
    'landing.req_beg':   'Beginner — starting from scratch',
    'landing.req_mid':   'Intermediate — some experience',
    'landing.req_adv':   'Advanced — I train regularly',
    'landing.req_send':  'Send request',
    'landing.success_title': 'Request sent!',
    'landing.success_msg': 'I\'ll get in touch within 24 hours to confirm your spot.',

    // ── GENERAL ────────────────────────────
    'general.back':      '← Back',
    'general.close':     'Close',
    'general.loading':   'Loading...',
    'general.error':     'Failed to load',
    'general.confirm_cancel_class': 'Cancel this class? All members will be notified.',
    'general.reminder_sent': 'Reminder sent to',
    'general.notes_saved': '✅ Notes saved',
    'general.class_created': '✅ Class created',
    'general.class_cancelled': '✅ Class cancelled — members notified',
    'general.booked': '✅ Spot booked — you\'ll receive a confirmation email',
    'general.waitlisted': '⏳ Added to the waitlist',
    'general.booking_cancelled': 'Booking cancelled',
    'general.marked_paid': '✅ Marked as paid',
    'general.creating': 'Creating...',
    'general.entering': 'Signing in...',
    'general.creating_account': 'Creating account...',
  }
};

// ── ESTADO ───────────────────────────────────────────────────
let currentLang = localStorage.getItem('ft_lang') || 'es';

// ── FUNCIONES PÚBLICAS ───────────────────────────────────────

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key])
    || (TRANSLATIONS['es'][key])
    || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ft_lang', lang);
  applyTranslations();
  updateLangToggle();
}

function toggleLang() {
  setLang(currentLang === 'es' ? 'en' : 'es');
}

function applyTranslations() {
  // Aplica traducciones a todos los elementos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else if (el.tagName === 'OPTION') {
      el.textContent = val;
    } else {
      el.innerHTML = val;
    }
  });
  // Actualiza atributos data-i18n-placeholder
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  // Actualiza el atributo lang del html
  document.documentElement.lang = currentLang;
}

function updateLangToggle() {
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = currentLang === 'es' ? 'EN' : 'ES';
    btn.title = currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español';
  });
}

// Exponer globalmente
window.t          = t;
window.setLang    = setLang;
window.toggleLang = toggleLang;
window.applyTranslations = applyTranslations;
