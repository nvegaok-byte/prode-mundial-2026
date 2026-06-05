// ============ CONFIGURACIÓN ============
const API_URL = 'https://script.google.com/macros/s/AKfycbwbdxlbkiOEy6G5leSUqOlciSwlV4p1CRUvg8cKN63mYPk8c_cCEg4vkKjm_qOEq0QU/exec';

// ============ API CLIENT ============
async function api(action, params = {}) {
  try {
    const body = JSON.stringify({ action, ...params });
    const resp = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body
    });
    return await resp.json();
  } catch (err) {
    return { ok: false, error: 'Error de conexión: ' + err.message };
  }
}

// ============ EQUIPOS DEL MUNDIAL 2026 ============
const TEAMS = {
  MEX:{name:"México",flag:"🇲🇽",group:"A"}, RSA:{name:"Sudáfrica",flag:"🇿🇦",group:"A"},
  KOR:{name:"Corea del Sur",flag:"🇰🇷",group:"A"}, CZE:{name:"Chequia",flag:"🇨🇿",group:"A"},
  CAN:{name:"Canadá",flag:"🇨🇦",group:"B"}, BIH:{name:"Bosnia y Herz.",flag:"🇧🇦",group:"B"},
  QAT:{name:"Catar",flag:"🇶🇦",group:"B"}, SUI:{name:"Suiza",flag:"🇨🇭",group:"B"},
  BRA:{name:"Brasil",flag:"🇧🇷",group:"C"}, MAR:{name:"Marruecos",flag:"🇲🇦",group:"C"},
  HAI:{name:"Haití",flag:"🇭🇹",group:"C"}, SCO:{name:"Escocia",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",group:"C"},
  USA:{name:"Estados Unidos",flag:"🇺🇸",group:"D"}, PAR:{name:"Paraguay",flag:"🇵🇾",group:"D"},
  AUS:{name:"Australia",flag:"🇦🇺",group:"D"}, TUR:{name:"Turquía",flag:"🇹🇷",group:"D"},
  GER:{name:"Alemania",flag:"🇩🇪",group:"E"}, CUW:{name:"Curazao",flag:"🇨🇼",group:"E"},
  CIV:{name:"Costa de Marfil",flag:"🇨🇮",group:"E"}, ECU:{name:"Ecuador",flag:"🇪🇨",group:"E"},
  NED:{name:"Países Bajos",flag:"🇳🇱",group:"F"}, JPN:{name:"Japón",flag:"🇯🇵",group:"F"},
  TUN:{name:"Túnez",flag:"🇹🇳",group:"F"}, SWE:{name:"Suecia",flag:"🇸🇪",group:"F"},
  BEL:{name:"Bélgica",flag:"🇧🇪",group:"G"}, EGY:{name:"Egipto",flag:"🇪🇬",group:"G"},
  IRN:{name:"Irán",flag:"🇮🇷",group:"G"}, NZL:{name:"Nueva Zelanda",flag:"🇳🇿",group:"G"},
  ESP:{name:"España",flag:"🇪🇸",group:"H"}, CPV:{name:"Cabo Verde",flag:"🇨🇻",group:"H"},
  KSA:{name:"Arabia Saudí",flag:"🇸🇦",group:"H"}, URU:{name:"Uruguay",flag:"🇺🇾",group:"H"},
  FRA:{name:"Francia",flag:"🇫🇷",group:"I"}, SEN:{name:"Senegal",flag:"🇸🇳",group:"I"},
  NOR:{name:"Noruega",flag:"🇳🇴",group:"I"}, IRQ:{name:"Irak",flag:"🇮🇶",group:"I"},
  ARG:{name:"Argentina",flag:"🇦🇷",group:"J"}, ALG:{name:"Argelia",flag:"🇩🇿",group:"J"},
  AUT:{name:"Austria",flag:"🇦🇹",group:"J"}, JOR:{name:"Jordania",flag:"🇯🇴",group:"J"},
  POR:{name:"Portugal",flag:"🇵🇹",group:"K"}, COL:{name:"Colombia",flag:"🇨🇴",group:"K"},
  UZB:{name:"Uzbekistán",flag:"🇺🇿",group:"K"}, COD:{name:"RD del Congo",flag:"🇨🇩",group:"K"},
  ENG:{name:"Inglaterra",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",group:"L"}, CRO:{name:"Croacia",flag:"🇭🇷",group:"L"},
  PAN:{name:"Panamá",flag:"🇵🇦",group:"L"}, GHA:{name:"Ghana",flag:"🇬🇭",group:"L"}
};

// ============ FIXTURE EN HORA ARGENTINA (UTC-3) ============
// Fuente única: Tríptico oficial "Fuerza Total 2026" - transcripción literal sin modificaciones
// Cada partido conserva el día y hora EXACTOS del PDF
const MATCHES = [
  // ===== GRUPO A =====
  {id:1, date:"11 jun", time:"16:00", home:"MEX", away:"RSA", venue:"Azteca, CDMX",       round:1, group:"A"},
  {id:2, date:"11 jun", time:"23:00", home:"KOR", away:"CZE", venue:"Guadalajara",        round:1, group:"A"},
  {id:3, date:"18 jun", time:"13:00", home:"CZE", away:"RSA", venue:"Atlanta",            round:2, group:"A"},
  {id:4, date:"18 jun", time:"22:00", home:"MEX", away:"KOR", venue:"Guadalajara",        round:2, group:"A"},
  {id:5, date:"24 jun", time:"22:00", home:"CZE", away:"MEX", venue:"CDMX",               round:3, group:"A"},
  {id:6, date:"24 jun", time:"22:00", home:"RSA", away:"KOR", venue:"Monterrey",          round:3, group:"A"},

  // ===== GRUPO B =====
  {id:7, date:"12 jun", time:"16:00", home:"CAN", away:"BIH", venue:"Toronto",            round:1, group:"B"},
  {id:8, date:"13 jun", time:"16:00", home:"QAT", away:"SUI", venue:"San Francisco",      round:1, group:"B"},
  {id:9, date:"18 jun", time:"16:00", home:"SUI", away:"BIH", venue:"Los Ángeles",        round:2, group:"B"},
  {id:10,date:"18 jun", time:"19:00", home:"CAN", away:"QAT", venue:"Vancouver",          round:2, group:"B"},
  {id:11,date:"24 jun", time:"16:00", home:"SUI", away:"CAN", venue:"Vancouver",          round:3, group:"B"},
  {id:12,date:"24 jun", time:"16:00", home:"BIH", away:"QAT", venue:"Seattle",            round:3, group:"B"},

  // ===== GRUPO C =====
  {id:13,date:"13 jun", time:"19:00", home:"BRA", away:"MAR", venue:"Nueva York",         round:1, group:"C"},
  {id:14,date:"13 jun", time:"22:00", home:"HAI", away:"SCO", venue:"Boston",             round:1, group:"C"},
  {id:15,date:"19 jun", time:"19:00", home:"SCO", away:"MAR", venue:"Boston",             round:2, group:"C"},
  {id:16,date:"19 jun", time:"19:30", home:"BRA", away:"HAI", venue:"Filadelfia",         round:2, group:"C"},
  {id:17,date:"24 jun", time:"19:00", home:"BRA", away:"SCO", venue:"Miami",              round:3, group:"C"},
  {id:18,date:"24 jun", time:"19:00", home:"MAR", away:"HAI", venue:"Atlanta",            round:3, group:"C"},

  // ===== GRUPO D =====
  {id:19,date:"12 jun", time:"22:00", home:"USA", away:"PAR", venue:"Los Ángeles",        round:1, group:"D"},
  {id:20,date:"14 jun", time:"01:00", home:"AUS", away:"TUR", venue:"Vancouver",          round:1, group:"D"},
  {id:21,date:"19 jun", time:"16:00", home:"USA", away:"AUS", venue:"Los Ángeles",        round:2, group:"D"},
  {id:22,date:"20 jun", time:"00:00", home:"TUR", away:"PAR", venue:"Dallas",             round:2, group:"D"},
  {id:23,date:"25 jun", time:"23:00", home:"TUR", away:"USA", venue:"Los Ángeles",        round:3, group:"D"},
  {id:24,date:"25 jun", time:"23:00", home:"PAR", away:"AUS", venue:"Seattle",            round:3, group:"D"},

  // ===== GRUPO E =====
  {id:25,date:"14 jun", time:"14:00", home:"GER", away:"CUW", venue:"Atlanta",            round:1, group:"E"},
  {id:26,date:"14 jun", time:"20:00", home:"CIV", away:"ECU", venue:"Houston",            round:1, group:"E"},
  {id:27,date:"20 jun", time:"17:00", home:"GER", away:"CIV", venue:"Atlanta",            round:2, group:"E"},
  {id:28,date:"20 jun", time:"21:00", home:"ECU", away:"CUW", venue:"Houston",            round:2, group:"E"},
  {id:29,date:"25 jun", time:"17:00", home:"CUW", away:"CIV", venue:"Houston",            round:3, group:"E"},
  {id:30,date:"25 jun", time:"17:00", home:"ECU", away:"GER", venue:"Atlanta",            round:3, group:"E"},

  // ===== GRUPO F =====
  {id:31,date:"14 jun", time:"17:00", home:"NED", away:"JPN", venue:"Filadelfia",         round:1, group:"F"},
  {id:32,date:"14 jun", time:"23:00", home:"SWE", away:"TUN", venue:"Miami",              round:1, group:"F"},
  {id:33,date:"20 jun", time:"14:00", home:"NED", away:"SWE", venue:"Filadelfia",         round:2, group:"F"},
  {id:34,date:"21 jun", time:"01:00", home:"TUN", away:"JPN", venue:"Miami",              round:2, group:"F"},
  {id:35,date:"25 jun", time:"20:00", home:"JPN", away:"SWE", venue:"Miami",              round:3, group:"F"},
  {id:36,date:"25 jun", time:"20:00", home:"TUN", away:"NED", venue:"Filadelfia",         round:3, group:"F"},

  // ===== GRUPO G =====
  {id:37,date:"15 jun", time:"16:00", home:"BEL", away:"EGY", venue:"Atlanta",            round:1, group:"G"},
  {id:38,date:"15 jun", time:"22:00", home:"IRN", away:"NZL", venue:"Seattle",            round:1, group:"G"},
  {id:39,date:"21 jun", time:"16:00", home:"BEL", away:"IRN", venue:"Atlanta",            round:2, group:"G"},
  {id:40,date:"21 jun", time:"22:00", home:"NZL", away:"EGY", venue:"Seattle",            round:2, group:"G"},
  {id:41,date:"27 jun", time:"00:00", home:"EGY", away:"IRN", venue:"Seattle",            round:3, group:"G"},
  {id:42,date:"27 jun", time:"00:00", home:"NZL", away:"BEL", venue:"Atlanta",            round:3, group:"G"},

  // ===== GRUPO H =====
  {id:43,date:"15 jun", time:"13:00", home:"ESP", away:"CPV", venue:"Dallas",             round:1, group:"H"},
  {id:44,date:"15 jun", time:"19:00", home:"KSA", away:"URU", venue:"Kansas City",        round:1, group:"H"},
  {id:45,date:"21 jun", time:"13:00", home:"ESP", away:"KSA", venue:"Kansas City",        round:2, group:"H"},
  {id:46,date:"21 jun", time:"19:00", home:"URU", away:"CPV", venue:"Dallas",             round:2, group:"H"},
  {id:47,date:"26 jun", time:"21:00", home:"CPV", away:"KSA", venue:"Kansas City",        round:3, group:"H"},
  {id:48,date:"26 jun", time:"21:00", home:"URU", away:"ESP", venue:"Dallas",             round:3, group:"H"},

  // ===== GRUPO I =====
  {id:49,date:"16 jun", time:"16:00", home:"FRA", away:"SEN", venue:"Nueva York",         round:1, group:"I"},
  {id:50,date:"16 jun", time:"19:00", home:"IRQ", away:"NOR", venue:"Boston",             round:1, group:"I"},
  {id:51,date:"22 jun", time:"18:00", home:"FRA", away:"IRQ", venue:"Filadelfia",         round:2, group:"I"},
  {id:52,date:"22 jun", time:"21:00", home:"NOR", away:"SEN", venue:"Houston",            round:2, group:"I"},
  {id:53,date:"26 jun", time:"16:00", home:"NOR", away:"FRA", venue:"Atlanta",            round:3, group:"I"},
  {id:54,date:"26 jun", time:"16:00", home:"SEN", away:"IRQ", venue:"Filadelfia",         round:3, group:"I"},

  // ===== GRUPO J (ARGENTINA) =====
  {id:55,date:"16 jun", time:"22:00", home:"ARG", away:"ALG", venue:"Arrowhead, Kansas City", round:1, group:"J"},
  {id:56,date:"17 jun", time:"01:00", home:"AUT", away:"JOR", venue:"San Francisco",      round:1, group:"J"},
  {id:57,date:"22 jun", time:"14:00", home:"ARG", away:"AUT", venue:"AT&T, Dallas",       round:2, group:"J"},
  {id:58,date:"23 jun", time:"00:00", home:"JOR", away:"ALG", venue:"San Francisco",      round:2, group:"J"},
  {id:59,date:"27 jun", time:"23:00", home:"ALG", away:"AUT", venue:"Kansas City",        round:3, group:"J"},
  {id:60,date:"27 jun", time:"23:00", home:"JOR", away:"ARG", venue:"AT&T, Dallas",       round:3, group:"J"},

  // ===== GRUPO K =====
  {id:61,date:"17 jun", time:"14:00", home:"POR", away:"COD", venue:"Houston",            round:1, group:"K"},
  {id:62,date:"17 jun", time:"23:00", home:"UZB", away:"COL", venue:"CDMX",               round:1, group:"K"},
  {id:63,date:"23 jun", time:"14:00", home:"POR", away:"UZB", venue:"Atlanta",            round:2, group:"K"},
  {id:64,date:"23 jun", time:"23:00", home:"COL", away:"COD", venue:"Miami",              round:2, group:"K"},
  {id:65,date:"27 jun", time:"20:30", home:"COL", away:"POR", venue:"Miami",              round:3, group:"K"},
  {id:66,date:"27 jun", time:"20:30", home:"COD", away:"UZB", venue:"Nueva York",         round:3, group:"K"},

  // ===== GRUPO L =====
  {id:67,date:"17 jun", time:"17:00", home:"ENG", away:"CRO", venue:"Dallas",             round:1, group:"L"},
  {id:68,date:"17 jun", time:"20:00", home:"GHA", away:"PAN", venue:"Toronto",            round:1, group:"L"},
  {id:69,date:"23 jun", time:"17:00", home:"ENG", away:"GHA", venue:"Nueva York",         round:2, group:"L"},
  {id:70,date:"23 jun", time:"20:00", home:"PAN", away:"CRO", venue:"Boston",             round:2, group:"L"},
  {id:71,date:"27 jun", time:"18:00", home:"PAN", away:"ENG", venue:"Filadelfia",         round:3, group:"L"},
  {id:72,date:"27 jun", time:"18:00", home:"CRO", away:"GHA", venue:"Nueva York",         round:3, group:"L"}
];

function getDayName(date) {
  const map = {
    "11 jun":"Jueves · APERTURA 🎉",
    "12 jun":"Viernes",
    "13 jun":"Sábado",
    "14 jun":"Domingo",
    "15 jun":"Lunes",
    "16 jun":"Martes 🇦🇷 (DEBUT)",
    "17 jun":"Miércoles",
    "18 jun":"Jueves",
    "19 jun":"Viernes",
    "20 jun":"Sábado",
    "21 jun":"Domingo",
    "22 jun":"Lunes 🇦🇷",
    "23 jun":"Martes",
    "24 jun":"Miércoles",
    "25 jun":"Jueves",
    "26 jun":"Viernes",
    "27 jun":"Sábado 🇦🇷 (CIERRE - Jordania vs ARG 23:00)"
  };
  return map[date] || '';
}
