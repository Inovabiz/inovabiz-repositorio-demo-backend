const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────
// VULNERABILIDAD 1: Path Traversal
// ❌ DEMO: El usuario puede leer cualquier archivo del sistema
// ─────────────────────────────────────────────
app.get('/file', (req, res) => {
  const filename = req.query.name;

  // ❌ DEMO: No se sanitiza el parámetro — permite ../../../etc/passwd
  try {
    const filePath = path.join(__dirname, 'uploads', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// VULNERABILIDAD 2: Prototype Pollution
// ❌ DEMO: Fusión recursiva insegura de objetos desde input del usuario
// ─────────────────────────────────────────────
function mergeObjects(target, source) {
  for (const key of Object.keys(source)) {
    // ❌ DEMO: No se excluye '__proto__', permite contaminar el prototipo
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = target[key] || {};
      mergeObjects(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

app.post('/merge', (req, res) => {
  const userInput = req.body;
  const config = {};
  // ❌ DEMO: Si userInput contiene {"__proto__": {"admin": true}}, contamina Object.prototype
  mergeObjects(config, userInput);
  res.json({ config });
});

// ─────────────────────────────────────────────
// VULNERABILIDAD 3: ReDoS (Regular Expression Denial of Service)
// ❌ DEMO: Expresión regular catastrófica que puede bloquear el event loop
// ─────────────────────────────────────────────
app.get('/validate', (req, res) => {
  const input = req.query.email;

  // ❌ DEMO: Regex con backtracking exponencial — vulnerable a ReDoS
  const vulnerableRegex = /^([a-zA-Z0-9])(([a-zA-Z0-9])*([\-])*([a-zA-Z0-9])*)*@([a-zA-Z0-9]+)([\-]+[a-zA-Z0-9]+)*(\.[a-zA-Z]{2,})+$/;
  const isValid = vulnerableRegex.test(input);

  res.json({ valid: isValid });
});

// ─────────────────────────────────────────────
// VULNERABILIDAD 4: SSRF (Server-Side Request Forgery)
// ❌ DEMO: El servidor realiza peticiones HTTP a URLs controladas por el usuario
// ─────────────────────────────────────────────
app.get('/fetch', async (req, res) => {
  const targetUrl = req.query.url;

  // ❌ DEMO: No se valida ni restringe la URL — permite acceder a servicios internos
  //          por ejemplo: http://169.254.169.254/latest/meta-data/ (AWS metadata)
  try {
    const response = await axios.get(targetUrl);
    res.json({ data: response.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// VULNERABILIDAD 5: Deserialización insegura mediante eval()
// ❌ DEMO: Se deserializa input del usuario con eval() en lugar de JSON.parse()
// ─────────────────────────────────────────────
app.post('/deserialize', (req, res) => {
  const rawData = req.body.data;

  // ❌ DEMO: eval() ejecuta código arbitrario — permite RCE si el cliente envía
  //          algo como: {"data": "process.mainModule.require('child_process').execSync('id')"}
  const parsed = eval('(' + rawData + ')');

  res.json({ parsed });
});

// ─────────────────────────────────────────────
// Inicio del servidor
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor de vulnerabilidades de demo iniciado en http://localhost:${PORT}`);
});
