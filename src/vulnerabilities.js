/**
 * ⚠️  ARCHIVO DE DEMOSTRACIÓN — VULNERABILIDADES EN NODE.JS
 *
 * Este archivo contiene ejemplos de vulnerabilidades comunes en el desarrollo
 * con Node.js. Su único propósito es ilustrar malas prácticas de seguridad
 * para capacitación y demostraciones de GitHub Advanced Security (GHAS).
 *
 * ❌ NO usar este código en producción.
 */

'use strict';

const fs        = require('fs');
const path      = require('path');
const crypto    = require('crypto');
const https     = require('https');
const { exec, execSync } = require('child_process');

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREDENCIALES HARDCODEADAS
//    ❌ Secretos embebidos directamente en el código fuente.
//    ✅ Deben cargarse desde variables de entorno o un gestor de secretos.
// ─────────────────────────────────────────────────────────────────────────────
const DB_PASSWORD  = 'P@ssw0rd_super_secreta_123';  // ❌ hardcoded credential
const API_KEY      = 'sk-prod-1234567890abcdef';     // ❌ hardcoded API key
const PRIVATE_KEY  = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep3VS5JJcds3xHn\nygWep3VS5JJcds3xHnygWep3VS5JJcds3xHnygWep3VS5JJcds\n3xHnygWep3VS5JJcds3xHnygWep3VS5JJcds3xHnygWep3VS5J\nJcds3xHnygWep3VS5JJcds3xHnygWep3VS5JJcds3xHnygWep3\nVS5JJcds3xHnygWep3VS5JJcds3xHnygWep3VS5JJcds3xHnyg\nWep3VS5JJcds3xHnygWep3VS5JJcds3xHnygWep3VS5JJcds3x\n-----END RSA PRIVATE KEY-----'; // ❌ hardcoded private key

function connectToDatabase(host) {
  // ❌ Contraseña visible en logs / historial de procesos
  execSync(`mysql -h ${host} -u admin -p${DB_PASSWORD} mydb`);
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. INYECCIÓN DE COMANDOS (Command Injection)
//    ❌ Input del usuario concatenado directamente en un comando del sistema.
//    ✅ Usar execFile() con argumentos separados o sanitizar el input.
// ─────────────────────────────────────────────────────────────────────────────
function getFileInfo(filename) {
  // ❌ RCE: un atacante puede enviar "archivo.txt; rm -rf /" como filename
  exec('ls -la ' + filename, (err, stdout) => {
    console.log(stdout);
  });
}

function pingHost(userInput) {
  // ❌ RCE con input del usuario sin escapar
  const result = execSync('ping -c 1 ' + userInput);
  return result.toString();
}


// ─────────────────────────────────────────────────────────────────────────────
// 3. PATH TRAVERSAL (Directory Traversal)
//    ❌ Lectura de archivos usando rutas controladas por el usuario.
//    ✅ Resolver la ruta y verificar que esté dentro del directorio permitido.
// ─────────────────────────────────────────────────────────────────────────────
function readUserFile(userFilename) {
  // ❌ Un atacante puede enviar "../../etc/passwd" como userFilename
  const filePath = '/var/app/uploads/' + userFilename;
  return fs.readFileSync(filePath, 'utf8');
}

function serveStaticFile(req, res) {
  // ❌ Sin normalización de ruta
  const file = path.join('/public', req.query.file);
  res.end(fs.readFileSync(file));
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. USO INSEGURO DE eval()
//    ❌ Ejecución de código arbitrario proporcionado por el usuario.
//    ✅ Nunca pasar input externo a eval(), Function() o similares.
// ─────────────────────────────────────────────────────────────────────────────
function calculateExpression(userExpression) {
  // ❌ Ejecución de código arbitrario
  return eval(userExpression);
}

function buildDynamicFunction(userCode) {
  // ❌ Equivalente a eval()
  const fn = new Function('data', userCode);
  return fn({ secret: DB_PASSWORD });
}


// ─────────────────────────────────────────────────────────────────────────────
// 5. DESERIALIZACIÓN INSEGURA
//    ❌ Parsear JSON/objetos de una fuente no confiable sin validación.
//    ✅ Validar el esquema con ajv, joi, zod u otra librería.
// ─────────────────────────────────────────────────────────────────────────────
function processUserData(rawBody) {
  // ❌ Sin validación de estructura ni tipos
  const data = JSON.parse(rawBody);

  // ❌ Contaminación de prototipo (Prototype Pollution)
  //    Un atacante puede enviar {"__proto__": {"isAdmin": true}}
  Object.assign({}, data);

  return data;
}

function mergeConfig(target, source) {
  // ❌ Merge recursivo sin filtrar claves peligrosas como __proto__
  for (const key in source) {
    if (typeof source[key] === 'object') {
      target[key] = mergeConfig(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}


// ─────────────────────────────────────────────────────────────────────────────
// 6. CRIPTOGRAFÍA DÉBIL
//    ❌ Uso de algoritmos obsoletos o inseguros (MD5, SHA1, DES).
//    ✅ Usar bcrypt/argon2 para contraseñas; AES-256-GCM para cifrado.
// ─────────────────────────────────────────────────────────────────────────────
function hashPassword(password) {
  // ❌ MD5 es inseguro para contraseñas; no usa salt
  return crypto.createHash('md5').update(password).digest('hex');
}

function encryptData(data) {
  // ❌ DES es un algoritmo obsoleto con clave de 56 bits
  const key = Buffer.from('12345678');
  const cipher = crypto.createCipheriv('des', key, Buffer.alloc(8));
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('hex');
}

function generateToken() {
  // ❌ Math.random() no es criptográficamente seguro
  return Math.random().toString(36).substring(2);
}


// ─────────────────────────────────────────────────────────────────────────────
// 7. EXPOSICIÓN DE INFORMACIÓN SENSIBLE
//    ❌ Enviar stack traces o detalles internos al cliente.
//    ✅ Loguear internamente y devolver mensajes genéricos al usuario.
// ─────────────────────────────────────────────────────────────────────────────
function riskyOperation(req, res) {
  try {
    const data = JSON.parse(req.body);
    res.json(data);
  } catch (err) {
    // ❌ Stack trace expuesto al cliente
    res.status(500).json({ error: err.stack });
  }
}

function logRequest(req) {
  // ❌ Contraseñas y tokens registrados en logs
  console.log('Request body:', JSON.stringify(req.body));
  console.log('Authorization header:', req.headers['authorization']);
}


// ─────────────────────────────────────────────────────────────────────────────
// 8. REDIRECCIÓN ABIERTA (Open Redirect)
//    ❌ Redirigir a una URL controlada por el usuario sin validación.
//    ✅ Usar una lista blanca de dominios permitidos.
// ─────────────────────────────────────────────────────────────────────────────
function handleRedirect(req, res) {
  // ❌ Un atacante puede enviar "https://evil.com" como parámetro
  const redirectUrl = req.query.next || '/home';
  res.redirect(redirectUrl);
}


// ─────────────────────────────────────────────────────────────────────────────
// 9. PETICIÓN HTTP SIN VERIFICACIÓN DE TLS
//    ❌ Deshabilitar la validación de certificados SSL/TLS.
//    ✅ Nunca deshabilitar rejectUnauthorized en producción.
// ─────────────────────────────────────────────────────────────────────────────
function fetchFromInternalService(url) {
  // ❌ Verificación de certificado deshabilitada — vulnerable a MITM
  const options = {
    rejectUnauthorized: false,
  };
  return new Promise((resolve, reject) => {
    https.get(url, options, (resp) => {
      let data = '';
      resp.on('data', chunk => { data += chunk; });
      resp.on('end', () => resolve(data));
    }).on('error', reject);
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// 10. INYECCIÓN SQL (simulada)
//     ❌ Concatenación de input del usuario en una query SQL.
//     ✅ Usar prepared statements o query builders con parámetros.
// ─────────────────────────────────────────────────────────────────────────────
function getUserByUsername(db, username) {
  // ❌ SQL Injection: username = "' OR '1'='1" autentica sin contraseña
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  return db.query(query);
}

function searchProducts(db, keyword) {
  // ❌ Sin escapado ni parametrización
  return db.query(`SELECT * FROM products WHERE name LIKE '%${keyword}%'`);
}


// ─────────────────────────────────────────────────────────────────────────────
// Exportaciones (para uso en rutas de Express si se integra al proyecto)
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  connectToDatabase,
  getFileInfo,
  pingHost,
  readUserFile,
  serveStaticFile,
  calculateExpression,
  buildDynamicFunction,
  processUserData,
  mergeConfig,
  hashPassword,
  encryptData,
  generateToken,
  riskyOperation,
  logRequest,
  handleRedirect,
  fetchFromInternalService,
  getUserByUsername,
  searchProducts,
};
