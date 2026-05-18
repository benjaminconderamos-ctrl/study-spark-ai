export type Lang = "en" | "es-MX";

export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es-MX", label: "Español (México)" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // Nav
  "nav.dashboard": "Dashboard",
  "nav.library": "Library",
  "nav.progress": "Progress",
  "nav.settings": "Settings",
  "nav.signOut": "Sign out",

  // Dashboard
  "dash.eyebrow": "Workspace",
  "dash.title": "Good to see you.",
  "dash.desc": "Pick up where you left off, or start something new.",
  "dash.uploadPdf": "Upload PDF",
  "dash.documents": "Documents",
  "dash.flashcards": "Flashcards",
  "dash.quizzesTaken": "Quizzes taken",
  "dash.avgScore": "Avg score",
  "dash.inLibrary": "In your library",
  "dash.noUploads": "No uploads yet",
  "dash.acrossDecks": "Across all decks",
  "dash.average": "Average",
  "dash.noAttempts": "No attempts yet",
  "dash.last20": "Last 20 attempts",
  "dash.quickActions": "Quick actions",
  "dash.qa.upload.title": "Upload a PDF",
  "dash.qa.upload.desc": "Start a new study workspace",
  "dash.qa.summary.title": "Generate a summary",
  "dash.qa.summary.desc": "Distill any document",
  "dash.qa.cards.title": "Make flashcards",
  "dash.qa.cards.desc": "Active recall, automatically",
  "dash.qa.tutor.title": "Ask the tutor",
  "dash.qa.tutor.desc": "Chat with your sources",
  "dash.recent": "Recent documents",
  "dash.empty.title": "Nothing here yet",
  "dash.empty.desc": "Upload your first PDF to get started.",

  // Progress
  "progress.eyebrow": "Insights",
  "progress.title": "Study progress",
  "progress.desc": "Time on task, your streak, and recent activity.",
  "progress.totalMinutes": "Total minutes",
  "progress.todayMinutes": "Today",
  "progress.weekMinutes": "Last 7 days",
  "progress.streak": "Day streak",
  "progress.streakHint": "Consecutive days studied",
  "progress.sessions": "Total sessions",
  "progress.byActivity": "Minutes by activity",
  "progress.recent": "Recent activity",
  "progress.empty.title": "No study time yet",
  "progress.empty.desc": "Open a document and start studying — your time will appear here.",
  "progress.minutesShort": "min",
  "progress.secondsShort": "s",
  "progress.reset": "Reset progress",
  "progress.resetConfirm": "Delete all your study session history? This cannot be undone.",
  "progress.resetDone": "Study progress reset.",

  // Activities
  "activity.summary": "Summary",
  "activity.flashcards": "Flashcards",
  "activity.quiz": "Quiz",
  "activity.chat": "Tutor chat",
  "activity.upload": "Upload",

  // Settings
  "settings.eyebrow": "Account",
  "settings.title": "Settings",
  "settings.email": "Email",
  "settings.userId": "User ID",
  "settings.language": "Language",
  "settings.languageHint": "Used across the interface.",

  // Common
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.save": "Save",
};

const esMX: Dict = {
  // Nav
  "nav.dashboard": "Panel",
  "nav.library": "Biblioteca",
  "nav.progress": "Progreso",
  "nav.settings": "Ajustes",
  "nav.signOut": "Cerrar sesión",

  // Dashboard
  "dash.eyebrow": "Espacio de trabajo",
  "dash.title": "Qué bueno verte.",
  "dash.desc": "Retoma donde lo dejaste o empieza algo nuevo.",
  "dash.uploadPdf": "Subir PDF",
  "dash.documents": "Documentos",
  "dash.flashcards": "Tarjetas",
  "dash.quizzesTaken": "Cuestionarios hechos",
  "dash.avgScore": "Promedio",
  "dash.inLibrary": "En tu biblioteca",
  "dash.noUploads": "Aún no subes nada",
  "dash.acrossDecks": "En todos los mazos",
  "dash.average": "Promedio",
  "dash.noAttempts": "Sin intentos aún",
  "dash.last20": "Últimos 20 intentos",
  "dash.quickActions": "Acciones rápidas",
  "dash.qa.upload.title": "Sube un PDF",
  "dash.qa.upload.desc": "Empieza un nuevo espacio de estudio",
  "dash.qa.summary.title": "Genera un resumen",
  "dash.qa.summary.desc": "Sintetiza cualquier documento",
  "dash.qa.cards.title": "Crea tarjetas",
  "dash.qa.cards.desc": "Recuerdo activo, automático",
  "dash.qa.tutor.title": "Pregúntale al tutor",
  "dash.qa.tutor.desc": "Chatea con tus fuentes",
  "dash.recent": "Documentos recientes",
  "dash.empty.title": "Aún no hay nada aquí",
  "dash.empty.desc": "Sube tu primer PDF para comenzar.",

  // Progress
  "progress.eyebrow": "Estadísticas",
  "progress.title": "Tu progreso de estudio",
  "progress.desc": "Tiempo dedicado, tu racha y actividad reciente.",
  "progress.totalMinutes": "Minutos totales",
  "progress.todayMinutes": "Hoy",
  "progress.weekMinutes": "Últimos 7 días",
  "progress.streak": "Días de racha",
  "progress.streakHint": "Días seguidos estudiando",
  "progress.sessions": "Sesiones totales",
  "progress.byActivity": "Minutos por actividad",
  "progress.recent": "Actividad reciente",
  "progress.empty.title": "Aún no hay tiempo de estudio",
  "progress.empty.desc": "Abre un documento y empieza a estudiar — tu tiempo aparecerá aquí.",
  "progress.minutesShort": "min",
  "progress.secondsShort": "s",
  "progress.reset": "Reiniciar progreso",
  "progress.resetConfirm": "¿Eliminar todo tu historial de sesiones de estudio? Esta acción no se puede deshacer.",
  "progress.resetDone": "Progreso reiniciado.",

  // Activities
  "activity.summary": "Resumen",
  "activity.flashcards": "Tarjetas",
  "activity.quiz": "Cuestionario",
  "activity.chat": "Chat con tutor",
  "activity.upload": "Subida",

  // Settings
  "settings.eyebrow": "Cuenta",
  "settings.title": "Ajustes",
  "settings.email": "Correo",
  "settings.userId": "ID de usuario",
  "settings.language": "Idioma",
  "settings.languageHint": "Se usa en toda la interfaz.",

  // Common
  "common.loading": "Cargando…",
  "common.cancel": "Cancelar",
  "common.save": "Guardar",
};

export const translations: Record<Lang, Dict> = {
  en,
  "es-MX": esMX,
};
