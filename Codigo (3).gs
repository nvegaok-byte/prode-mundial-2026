/**
 * PRODE MUNDIAL 2026 - API REST
 * Backend Apps Script para frontend en GitHub Pages
 */

const SHEET_ID = '1cET5l35jhARWNWvyHh6-DimfogYs_LLX3xXkpBh4cGQ';
const SHEET_USUARIOS = 'Usuarios';
const SHEET_ADMINS = 'Admins';
const SHEET_PRONOSTICOS = 'Pronosticos';
const SHEET_RESULTADOS = 'Resultados';
const SHEET_CONFIG = 'Config';

function doPost(e) { return handleRequest(e); }
function doGet(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    let params = {};
    if (e.postData && e.postData.contents) {
      try { params = JSON.parse(e.postData.contents); } catch(err) {}
    }
    if (e.parameter) {
      for (const k in e.parameter) {
        if (!params[k]) params[k] = e.parameter[k];
      }
    }
    
    const action = params.action || '';
    let result;
    
    switch(action) {
      case 'ping': result = { ok: true, msg: 'pong' }; break;
      case 'registrar': result = registrar(params.nombre, params.email, params.password); break;
      case 'login': result = login(params.email, params.password); break;
      case 'verificarUsuario': result = verificarUsuario(params.userId, params.password); break;
      case 'guardarPronosticosBatch': result = guardarPronosticosBatch(params.userId, params.password, params.pronosticos); break;
      case 'obtenerMisPronosticos': result = obtenerMisPronosticos(params.userId, params.password); break;
      case 'obtenerTablaGeneral': result = obtenerTablaGeneral(); break;
      case 'obtenerPronosticosPublicos': result = obtenerPronosticosPublicos(); break;
      case 'obtenerResultados': result = obtenerResultados(); break;
      case 'obtenerInfoPublica': result = obtenerInfoPublica(); break;
      case 'adminListarUsuarios': result = adminListarUsuarios(params.userId, params.password); break;
      case 'adminCambiarPago': result = adminCambiarPago(params.userId, params.password, params.targetUserId, params.nuevoEstado); break;
      case 'adminCargarResultado': result = adminCargarResultado(params.userId, params.password, params.partidoId, params.golesLocal, params.golesVisitante); break;
      case 'adminEliminarResultado': result = adminEliminarResultado(params.userId, params.password, params.partidoId); break;
      case 'adminAgregarAdmin': result = adminAgregarAdmin(params.userId, params.password, params.nuevoEmail, params.nuevoNombre); break;
      case 'adminListarAdmins': result = adminListarAdmins(params.userId, params.password); break;
      case 'adminCambiarFechaCierre': result = adminCambiarFechaCierre(params.userId, params.password, params.nuevaFecha); break;
      default: result = { ok: false, error: 'Acción no reconocida: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet(name) { return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name); }

function hashPassword(password) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + 'mundial2026_salt_nico');
  return raw.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function getConfig(clave) {
  const data = getSheet(SHEET_CONFIG).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === clave) return data[i][1];
  }
  return null;
}

function pronosticosCerrados() { return new Date() >= new Date(getConfig('fecha_cierre')); }

function esAdmin(email) {
  if (!email) return false;
  const data = getSheet(SHEET_ADMINS).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(email).toLowerCase() && String(data[i][2]).toUpperCase() === 'SI') return true;
  }
  return false;
}

function generarId() { return Utilities.getUuid().split('-')[0]; }

function registrar(nombre, email, password) {
  nombre = String(nombre || '').trim();
  email = String(email || '').trim().toLowerCase();
  password = String(password || '');
  if (!nombre || !email || !password) return { ok: false, error: 'Faltan datos' };
  if (password.length < 4) return { ok: false, error: 'La clave debe tener al menos 4 caracteres' };
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return { ok: false, error: 'Email inválido' };
  
  const sheet = getSheet(SHEET_USUARIOS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === email) return { ok: false, error: 'Ese email ya está registrado' };
  }
  
  const id = generarId();
  const hash = hashPassword(password);
  const adminFlag = esAdmin(email);
  sheet.appendRow([id, nombre, email, hash, adminFlag ? 'SI' : 'NO', new Date().toISOString()]);
  return { ok: true, usuario: { id, nombre, email, pago: adminFlag, admin: adminFlag } };
}

function login(email, password) {
  email = String(email || '').trim().toLowerCase();
  password = String(password || '');
  if (!email || !password) return { ok: false, error: 'Faltan datos' };
  const data = getSheet(SHEET_USUARIOS).getDataRange().getValues();
  const hash = hashPassword(password);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === email && data[i][3] === hash) {
      return { ok: true, usuario: { id: data[i][0], nombre: data[i][1], email: data[i][2], pago: String(data[i][4]).toUpperCase() === 'SI', admin: esAdmin(email) }};
    }
  }
  return { ok: false, error: 'Email o clave incorrectos' };
}

function verificarUsuario(userId, password) {
  if (!userId || !password) return { ok: false, error: 'Sesión inválida' };
  const data = getSheet(SHEET_USUARIOS).getDataRange().getValues();
  const hash = hashPassword(password);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][3] === hash) {
      return { ok: true, usuario: { id: data[i][0], nombre: data[i][1], email: data[i][2], pago: String(data[i][4]).toUpperCase() === 'SI', admin: esAdmin(data[i][2]) }};
    }
  }
  return { ok: false, error: 'Sesión inválida' };
}

function guardarPronosticosBatch(userId, password, pronosticos) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.pago) return { ok: false, error: 'Tu participación aún no fue habilitada por un administrador' };
  if (pronosticosCerrados()) return { ok: false, error: 'Los pronósticos están cerrados' };
  if (!pronosticos || typeof pronosticos !== 'object') return { ok: false, error: 'Datos inválidos' };
  
  const sheet = getSheet(SHEET_PRONOSTICOS);
  const data = sheet.getDataRange().getValues();
  const timestamp = new Date().toISOString();
  const filaMap = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) filaMap[parseInt(data[i][1])] = i + 1;
  }
  
  let guardados = 0;
  const nuevasFilas = [];
  for (const pid in pronosticos) {
    const p = pronosticos[pid];
    const gl = parseInt(p.local);
    const gv = parseInt(p.visitante);
    if (isNaN(gl) || isNaN(gv) || gl < 0 || gv < 0 || gl > 20 || gv > 20) continue;
    const pidInt = parseInt(pid);
    if (filaMap[pidInt]) {
      sheet.getRange(filaMap[pidInt], 3).setValue(gl);
      sheet.getRange(filaMap[pidInt], 4).setValue(gv);
      sheet.getRange(filaMap[pidInt], 5).setValue(timestamp);
    } else {
      nuevasFilas.push([userId, pidInt, gl, gv, timestamp]);
    }
    guardados++;
  }
  if (nuevasFilas.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, nuevasFilas.length, 5).setValues(nuevasFilas);
  }
  return { ok: true, guardados: guardados };
}

function obtenerMisPronosticos(userId, password) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  const data = getSheet(SHEET_PRONOSTICOS).getDataRange().getValues();
  const pronosticos = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      pronosticos[data[i][1]] = { local: parseInt(data[i][2]), visitante: parseInt(data[i][3]) };
    }
  }
  return { ok: true, pronosticos: pronosticos, cerrado: pronosticosCerrados() };
}

function obtenerTablaGeneral() {
  const usuarios = getSheet(SHEET_USUARIOS).getDataRange().getValues();
  const pronos = getSheet(SHEET_PRONOSTICOS).getDataRange().getValues();
  const resultados = getSheet(SHEET_RESULTADOS).getDataRange().getValues();
  const ptsExacto = parseInt(getConfig('pts_exacto')) || 5;
  const ptsAcierto = parseInt(getConfig('pts_acierto')) || 2;
  const resReal = {};
  for (let i = 1; i < resultados.length; i++) {
    const pid = parseInt(resultados[i][0]);
    const gl = parseInt(resultados[i][1]);
    const gv = parseInt(resultados[i][2]);
    if (!isNaN(pid) && !isNaN(gl) && !isNaN(gv)) resReal[pid] = { local: gl, visitante: gv };
  }
  const usuarioMap = {};
  for (let i = 1; i < usuarios.length; i++) {
    if (String(usuarios[i][4]).toUpperCase() === 'SI') {
      usuarioMap[usuarios[i][0]] = { id: usuarios[i][0], nombre: usuarios[i][1], puntos: 0, aciertos_exactos: 0, aciertos_ganador: 0, pronosticos_cargados: 0 };
    }
  }
  for (let i = 1; i < pronos.length; i++) {
    const uid = pronos[i][0];
    const pid = parseInt(pronos[i][1]);
    const gl = parseInt(pronos[i][2]);
    const gv = parseInt(pronos[i][3]);
    if (!usuarioMap[uid]) continue;
    usuarioMap[uid].pronosticos_cargados++;
    if (!resReal[pid]) continue;
    const real = resReal[pid];
    if (gl === real.local && gv === real.visitante) {
      usuarioMap[uid].puntos += ptsExacto;
      usuarioMap[uid].aciertos_exactos++;
    } else {
      const gp = gl > gv ? 'L' : (gl < gv ? 'V' : 'E');
      const gr = real.local > real.visitante ? 'L' : (real.local < real.visitante ? 'V' : 'E');
      if (gp === gr) {
        usuarioMap[uid].puntos += ptsAcierto;
        usuarioMap[uid].aciertos_ganador++;
      }
    }
  }
  const tabla = Object.values(usuarioMap).sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.aciertos_exactos !== a.aciertos_exactos) return b.aciertos_exactos - a.aciertos_exactos;
    return a.nombre.localeCompare(b.nombre);
  });
  return { ok: true, tabla: tabla, total_partidos_con_resultado: Object.keys(resReal).length, cerrado: pronosticosCerrados(), pts_exacto: ptsExacto, pts_acierto: ptsAcierto };
}

function obtenerPronosticosPublicos() {
  if (!pronosticosCerrados()) return { ok: false, error: 'Aún no se cerraron los pronósticos', cerrado: false };
  const usuarios = getSheet(SHEET_USUARIOS).getDataRange().getValues();
  const pronos = getSheet(SHEET_PRONOSTICOS).getDataRange().getValues();
  const usuarioMap = {};
  for (let i = 1; i < usuarios.length; i++) {
    if (String(usuarios[i][4]).toUpperCase() === 'SI') {
      usuarioMap[usuarios[i][0]] = { id: usuarios[i][0], nombre: usuarios[i][1], pronosticos: {} };
    }
  }
  for (let i = 1; i < pronos.length; i++) {
    const uid = pronos[i][0];
    if (!usuarioMap[uid]) continue;
    usuarioMap[uid].pronosticos[pronos[i][1]] = { local: parseInt(pronos[i][2]), visitante: parseInt(pronos[i][3]) };
  }
  return { ok: true, usuarios: Object.values(usuarioMap), cerrado: true };
}

function obtenerResultados() {
  const data = getSheet(SHEET_RESULTADOS).getDataRange().getValues();
  const resultados = {};
  for (let i = 1; i < data.length; i++) {
    const pid = parseInt(data[i][0]);
    if (!isNaN(pid)) resultados[pid] = { local: parseInt(data[i][1]), visitante: parseInt(data[i][2]) };
  }
  return { ok: true, resultados: resultados };
}

function obtenerInfoPublica() {
  return { ok: true, fecha_cierre: getConfig('fecha_cierre'), cerrado: pronosticosCerrados(), pts_exacto: parseInt(getConfig('pts_exacto')) || 5, pts_acierto: parseInt(getConfig('pts_acierto')) || 2 };
}

function adminListarUsuarios(userId, password) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.admin) return { ok: false, error: 'No autorizado' };
  const data = getSheet(SHEET_USUARIOS).getDataRange().getValues();
  const usuarios = [];
  for (let i = 1; i < data.length; i++) {
    usuarios.push({ id: data[i][0], nombre: data[i][1], email: data[i][2], pago: String(data[i][4]).toUpperCase() === 'SI', fecha_registro: data[i][5] });
  }
  return { ok: true, usuarios: usuarios };
}

function adminCambiarPago(userId, password, targetUserId, nuevoEstado) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.admin) return { ok: false, error: 'No autorizado' };
  const sheet = getSheet(SHEET_USUARIOS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === targetUserId) {
      sheet.getRange(i + 1, 5).setValue(nuevoEstado ? 'SI' : 'NO');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Usuario no encontrado' };
}

function adminCargarResultado(userId, password, partidoId, golesLocal, golesVisitante) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.admin) return { ok: false, error: 'No autorizado' };
  partidoId = parseInt(partidoId);
  golesLocal = parseInt(golesLocal);
  golesVisitante = parseInt(golesVisitante);
  if (isNaN(partidoId) || isNaN(golesLocal) || isNaN(golesVisitante)) return { ok: false, error: 'Datos inválidos' };
  const sheet = getSheet(SHEET_RESULTADOS);
  const data = sheet.getDataRange().getValues();
  const timestamp = new Date().toISOString();
  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][0]) === partidoId) {
      sheet.getRange(i + 1, 2).setValue(golesLocal);
      sheet.getRange(i + 1, 3).setValue(golesVisitante);
      sheet.getRange(i + 1, 4).setValue(user.usuario.email);
      sheet.getRange(i + 1, 5).setValue(timestamp);
      return { ok: true };
    }
  }
  sheet.appendRow([partidoId, golesLocal, golesVisitante, user.usuario.email, timestamp]);
  return { ok: true };
}

function adminEliminarResultado(userId, password, partidoId) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.admin) return { ok: false, error: 'No autorizado' };
  partidoId = parseInt(partidoId);
  const sheet = getSheet(SHEET_RESULTADOS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][0]) === partidoId) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'No encontrado' };
}

function adminAgregarAdmin(userId, password, nuevoEmail, nuevoNombre) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.admin) return { ok: false, error: 'No autorizado' };
  nuevoEmail = String(nuevoEmail || '').trim().toLowerCase();
  nuevoNombre = String(nuevoNombre || '').trim();
  if (!nuevoEmail) return { ok: false, error: 'Falta email' };
  const sheet = getSheet(SHEET_ADMINS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === nuevoEmail) {
      sheet.getRange(i + 1, 3).setValue('SI');
      return { ok: true };
    }
  }
  sheet.appendRow([nuevoEmail, nuevoNombre, 'SI']);
  return { ok: true };
}

function adminListarAdmins(userId, password) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.admin) return { ok: false, error: 'No autorizado' };
  const data = getSheet(SHEET_ADMINS).getDataRange().getValues();
  const admins = [];
  for (let i = 1; i < data.length; i++) {
    admins.push({ email: data[i][0], nombre: data[i][1], activo: String(data[i][2]).toUpperCase() === 'SI' });
  }
  return { ok: true, admins: admins };
}

function adminCambiarFechaCierre(userId, password, nuevaFecha) {
  const user = verificarUsuario(userId, password);
  if (!user.ok) return user;
  if (!user.usuario.admin) return { ok: false, error: 'No autorizado' };
  const sheet = getSheet(SHEET_CONFIG);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'fecha_cierre') {
      sheet.getRange(i + 1, 2).setValue(nuevaFecha);
      return { ok: true };
    }
  }
  return { ok: false, error: 'No encontrado' };
}
