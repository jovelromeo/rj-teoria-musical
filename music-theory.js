/* ═══════════════════════════════════════════════
   MODULO DE TEORIA MUSICAL — Funciones de utilidad
═══════════════════════════════════════════════ */

const LETRAS   = ['C','D','E','F','G','A','B'];
const SEMI_NAT = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const DELTA_ALT  = { '##':2, '#':1, '':0, 'b':-1, 'bb':-2 };

// Intervalos de semitonos para cada modo
const INT_MAY = [0,2,4,5,7,9,11];  // Mayor: T-T-S-T-T-T-S
const INT_MEN = [0,2,3,5,7,8,10];  // Menor: T-S-T-T-S-T-T

// Calidad de acordes por grado: 0=mayor, 1=menor, 2=disminuido
const CAL_MAY = [0,1,1,0,0,1,2];  // I-May, II-m, III-m, IV-May, V-May, VI-m, VII-dis
const CAL_MEN = [1,2,0,1,1,0,0];  // I-m, II-dis, III-May, IV-m, V-m, VI-May, VII-May

// Todas las raices posibles para generar escalas
const RAICES = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];

/* ═══════════════════════════════════════════════
   FUNCIONES AUXILIARES
═══════════════════════════════════════════════ */

function analizarNota(n) {
  const l = n[0];
  const a = n.slice(1);
  const alteracion = a === 'b' ? 'b' : a === '#' ? '#' : a === 'bb' ? 'bb' : a === '##' ? '##' : '';
  const s = ((SEMI_NAT[l] + (DELTA_ALT[alteracion] ?? 0)) % 12 + 12) % 12;
  return { l, s, alteracion };
}

function deletrear(letra, ts) {
  const nat = SEMI_NAT[letra];
  let d = ((ts - nat + 12) % 12);
  if (d === 10) d = -2;
  if (d === 11) d = -1;
  const m = {'-2':'bb','-1':'b','0':'','1':'#','2':'##'};
  const acc = m[String(d)];
  if (acc === undefined) return null;
  return letra + acc;
}

function construirEscala(raiz, tipo) {
  const { l: lr, s: sr } = analizarNota(raiz);
  const ints = tipo === 'mayor' ? INT_MAY : INT_MEN;
  const cals = tipo === 'mayor' ? CAL_MAY : CAL_MEN;
  const ir = LETRAS.indexOf(lr);
  
  return ints.map((s, i) => {
    const nota = deletrear(LETRAS[(ir + i) % 7], (sr + s) % 12);
    const calidad = cals[i];
    const sufijo = calidad === 0 ? '' : calidad === 1 ? 'm' : 'dim';
    return {
      grado: i + 1,
      nota,
      calidad,
      acorde: nota + sufijo,
      roman: ['I','II','III','IV','V','VI','VII'][i] + (calidad === 1 ? '' : calidad === 2 ? '°' : '')
    };
  });
}

function analizarAcorde(acorde) {
  // Formatos: "C", "Am", "F#dim", "Bbm", "C#", "F##m", "Bbbdim", etc.
  const match = acorde.match(/^([A-G])(#|b|##|bb)?(m|dim)?$/i);
  if (!match) return null;
  
  const [, letra, alteracion = '', calidadStr = ''] = match;
  const notaBase = letra.toUpperCase() + alteracion;
  
  let calidad;
  if (calidadStr === 'm') calidad = 1;      // menor
  else if (calidadStr === 'dim') calidad = 2; // disminuido
  else calidad = 0;                          // mayor
  
  const { s } = analizarNota(notaBase);
  return { nota: notaBase, semitono: s, calidad, calidadStr };
}

/* ═══════════════════════════════════════════════
   FUNCION PRINCIPAL: obtenerRelativo
═══════════════════════════════════════════════ */

/**
 * Obtiene el acorde relativo de un grado especifico de una escala.
 * @param {Object} params - Parametros nombrados
 * @param {string} params.tono - Tonalidad (C, D, E, F, G, A, B, opcionalmente con # o b)
 * @param {string} params.modo - 'M' para mayor, 'm' para menor
 * @param {number} params.numero - Numero de grado (1-7)
 * @returns {string|null} - El acorde relativo (ej: "Am", "C#dim") o null si error
 * 
 * Ejemplos:
 *   obtenerRelativo({ tono: 'C', modo: 'M', numero: 2 })  -> "Dm"
 *   obtenerRelativo({ tono: 'Am', modo: 'm', numero: 5 }) -> "Em"
 *   obtenerRelativo({ tono: 'G', modo: 'M', numero: 7 })  -> "F#dim"
 */
function obtenerRelativo({ tono, modo, numero }) {
  // Validar numero de grado
  if (numero < 1 || numero > 7) {
    console.error('El numero de grado debe estar entre 1 y 7');
    return null;
  }
  
  // Normalizar modo: 'm' = menor, 'M' u otra cosa = mayor
  const tipo = modo === 'm' ? 'menor' : 'mayor';
  
  // Extraer raiz (quitar 'm' si esta al final para tonalidades menores escritas como "Am")
  let raiz = tono;
  if (raiz.toLowerCase().endsWith('m')) {
    raiz = raiz.slice(0, -1);
  }
  
  // Construir la escala y obtener el grado solicitado
  const escala = construirEscala(raiz, tipo);
  const grado = escala[numero - 1];
  
  return grado ? grado.acorde : null;
}

/* ═══════════════════════════════════════════════
   FUNCION PRINCIPAL: obtenerRelativosFuente
═══════════════════════════════════════════════ */

/**
 * Obtiene todas las escalas que contienen un acorde especifico.
 * @param {Object} params - Parametros nombrados
 * @param {string} params.acorde - El acorde a buscar (ej: "Am", "C#dim", "G")
 * @returns {Array} - Array de objetos con { escala, modo, grado, roman, acorde }
 * 
 * Ejemplo:
 *   obtenerRelativosFuente({ acorde: "Am" }) -> [
 *     { escala: 'C', modo: 'mayor', grado: 6, roman: 'VI', acorde: 'Am' },
 *     { escala: 'Am', modo: 'menor', grado: 1, roman: 'I', acorde: 'Am' },
 *     ...
 *   ]
 */
function obtenerRelativosFuente({ acorde }) {
  const analizado = analizarAcorde(acorde);
  if (!analizado) {
    console.error('Formato de acorde no reconocido. Use formato como "Am", "C#dim", "G"');
    return [];
  }
  
  const resultados = [];
  
  // Buscar en todas las raices posibles
  for (const raiz of RAICES) {
    // Probar escala mayor
    const escalaMayor = construirEscala(raiz, 'mayor');
    for (const grado of escalaMayor) {
      const analizadoGrado = analizarAcorde(grado.acorde);
      if (analizadoGrado && 
          analizadoGrado.semitono === analizado.semitono && 
          analizadoGrado.calidad === analizado.calidad) {
        resultados.push({
          escala: raiz,
          modo: 'mayor',
          grado: grado.grado,
          roman: grado.roman,
          acorde: grado.acorde
        });
      }
    }
    
    // Probar escala menor
    const escalaMenor = construirEscala(raiz, 'menor');
    for (const grado of escalaMenor) {
      const analizadoGrado = analizarAcorde(grado.acorde);
      if (analizadoGrado && 
          analizadoGrado.semitono === analizado.semitono && 
          analizadoGrado.calidad === analizado.calidad) {
        resultados.push({
          escala: raiz,
          modo: 'menor',
          grado: grado.grado,
          roman: grado.roman,
          acorde: grado.acorde
        });
      }
    }
  }
  
  // Ordenar por modo (mayor primero), luego por grado
  return resultados.sort((a, b) => {
    if (a.modo !== b.modo) return a.modo === 'mayor' ? -1 : 1;
    return a.grado - b.grado;
  });
}

/* ═══════════════════════════════════════════════
   FUNCION AUXILIAR: Generar todas las escalas
═══════════════════════════════════════════════ */

/**
 * Genera todas las escalas posibles con sus grados.
 * Util para visualizacion completa.
 */
function generarTodasLasEscalas() {
  const escalas = [];
  
  for (const raiz of RAICES) {
    // Escala mayor
    const mayor = construirEscala(raiz, 'mayor');
    if (mayor.every(g => g.nota !== null)) {
      escalas.push({
        raiz: raiz,
        modo: 'mayor',
        nombre: raiz + ' mayor',
        nombreCorto: raiz,
        grados: mayor
      });
    }
    
    // Escala menor
    const menor = construirEscala(raiz, 'menor');
    if (menor.every(g => g.nota !== null)) {
      escalas.push({
        raiz: raiz,
        modo: 'menor',
        nombre: raiz + 'm',
        nombreCorto: raiz + 'm',
        grados: menor
      });
    }
  }
  
  return escalas;
}

/* ═══════════════════════════════════════════════
   FUNCIONES DE COMPATIBILIDAD PARA MODULOS I Y II
═══════════════════════════════════════════════ */

/**
 * Nombra una escala segun su raiz y tipo.
 * @param {string} r - Raiz (C, D, E, etc)
 * @param {string} t - Tipo ('mayor' o 'menor')
 * @returns {string} - Nombre de la escala (ej: "C", "Am")
 */
function nombrarEscala(r, t) {
  return r + (t === 'mayor' ? '' : 'm');
}

/**
 * Comprueba si dos acordes coinciden (misma nota base y calidad).
 * @param {string} a - Primer acorde
 * @param {string} b - Segundo acorde
 * @returns {boolean} - True si coinciden
 */
function coincidenAcordes(a, b) {
  const aa = analizarAcorde(a);
  const ab = analizarAcorde(b);
  return aa && ab && aa.semitono === ab.semitono && aa.calidad === ab.calidad;
}

/**
 * Construye escala en formato simplificado (array de strings).
 * Para compatibilidad con modulo1.
 * @param {string} raiz - Raiz de la escala
 * @param {string} tipo - 'mayor' o 'menor'
 * @returns {Array<string>} - Array de acordes
 */
function construirEscalaSimple(raiz, tipo) {
  const escala = construirEscala(raiz, tipo);
  return escala.map(g => g.acorde);
}

// Alias para compatibilidad con modulo1 y modulo2
const parsearNota = analizarNota;
const parsearAcorde = analizarAcorde;
const nombEsc = nombrarEscala;
const coinciden = coincidenAcordes;

// Exportar para uso en modulos (Node.js) o como globales (browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    obtenerRelativo, 
    obtenerRelativosFuente, 
    generarTodasLasEscalas, 
    construirEscala,
    construirEscalaSimple,
    nombrarEscala,
    coincidenAcordes,
    analizarNota,
    analizarAcorde,
    deletrear
  };
}
