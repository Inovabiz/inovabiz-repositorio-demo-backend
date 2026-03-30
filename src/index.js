const express = require('express');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const _ = require('lodash');

const app = express();
app.use(express.json());

// ❌ DEMO: Secreto JWT hardcodeado — detectado por CodeQL y Secret Scanning
const JWT_SECRET = 'demo_secret_exposed';

// Base de datos simulada (sin preparación de queries)
const users = [
  { id: 1, username: 'admin', password: 'admin123' },
  { id: 2, username: 'user',  password: 'password' },
];

// ─────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// POST /login
// ❌ DEMO: Falta validación de inputs + JWT con secreto hardcodeado
// ─────────────────────────────────────────────
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // ❌ DEMO: Concatenación de query (simulación de SQL Injection)
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  console.log('Query ejecutada (demo SQL Injection):', query);

  // Búsqueda simulada (sin prepared statements)
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // ❌ DEMO: Secreto hardcodeado en sign()
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

// ─────────────────────────────────────────────
// GET /search?q=<término>
// ❌ DEMO: eval() con input del usuario
// ❌ DEMO: child_process.exec() con input del usuario (RCE)
// ─────────────────────────────────────────────
app.get('/search', (req, res) => {
  const query = req.query.q;

  // ❌ DEMO: eval() — detectado por CodeQL como uso inseguro de eval
  const result = eval('"Búsqueda: " + query');

  // ❌ DEMO: child_process.exec() con input del usuario sin sanitizar (RCE)
  exec('echo ' + query, (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: 'Error en comando' });
    }

    // Uso de lodash para procesar resultados (dependencia vulnerable)
    const items = _.map(
      users.filter(u => _.includes(u.username, query || '')),
      u => ({ id: u.id, username: u.username })
    );

    res.json({ result, output: stdout.trim(), items });
  });
});

// ─────────────────────────────────────────────
// Inicio del servidor
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
