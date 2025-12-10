require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, 'data', 'records.csv');

// Memastikan direktori data
const dataDir = path.dirname(CSV_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Setup CSV Perekapan 
async function appendCsv(record) {
  const header = [
    { id: 'timestamp', title: 'timestamp' },
    { id: 'name', title: 'name' },
    { id: 'school', title: 'school' },
    { id: 'age', title: 'age' },
    { id: 'address', title: 'address' },
    { id: 'phone', title: 'phone' },
    { id: 'shape', title: 'shape' },
    { id: 'type', title: 'type' },
    { id: 'parameters', title: 'parameters' },
    { id: 'result', title: 'result' }
  ];

  const exists = fs.existsSync(CSV_PATH);
  const csvWriter = createCsvWriter({ path: CSV_PATH, header, append: exists });
  await csvWriter.writeRecords([record]);
}

// Setup Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Helpers: calculation functions
function calcAreaOrVolume(shape, vars) {
  const pi = Math.PI;
  shape = shape.toLowerCase();
  let result = null;
  let type = '';

  if (shape === 'persegi') {
    // luas persegi: sisi
    const s = parseFloat(vars.s);
    result = s * s;
    type = 'luas';
  } else if (shape === 'segitiga') {
    const a = parseFloat(vars.a); // alas
    const t = parseFloat(vars.t); // tinggi
    result = 0.5 * a * t;
    type = 'luas';
  } else if (shape === 'lingkaran') {
    const r = parseFloat(vars.r);
    result = pi * r * r;
    type = 'luas';
  } else if (shape === 'kubus') {
    const s = parseFloat(vars.s);
    result = s * s * s;
    type = 'volume';
  } else if (shape === 'limas') {
    // asumsi limas segiempat beraturan: volume = 1/3 * (s^2) * tinggi
    const s = parseFloat(vars.s);
    const t = parseFloat(vars.t);
    const baseArea = s * s;
    result = (1/3) * baseArea * t;
    type = 'volume';
  } else if (shape === 'tabung') {
    const r = parseFloat(vars.r);
    const h = parseFloat(vars.h);
    result = pi * r * r * h;
    type = 'volume';
  }

  if (result === null || Number.isNaN(result)) return { error: 'Invalid parameters' };
  return { result, type };
}

app.get('/', (req, res) => {
  res.render('landing');
});

// Serve form at /form
app.get('/form', (req, res) => {
  res.render('form');
});

app.post('/calculate', async (req, res) => {
  const { name, school, age, address, phone, shape } = req.body;
  // Kumpulkan parameter yang relevan tergantung pada bentuk
    const params = {};
  ['s','a','t','r','h'].forEach(k => { if (req.body[k]) params[k] = req.body[k]; });

  const calc = calcAreaOrVolume(shape, params);
  if (calc.error) return res.status(400).send(calc.error);

  const timestamp = new Date();
  const record = {
    timestamp: timestamp.toISOString().slice(0,19).replace('T',' '),
    name: name || '',
    school: school || '',
    age: age ? parseInt(age) : null,
    address: address || '',
    phone: phone || '',
    shape,
    type: calc.type,
    parameters: JSON.stringify(params),
    result: calc.result
  };

  // Menyimpan ke CSV
  try {
    await appendCsv(record);
  } catch (e) {
    console.error('CSV save failed', e.message);
  }

  // Menyimpan ke Supabase
  try {
    const { error } = await supabase
      .from('calculations')
      .insert({
        timestamp: timestamp.toISOString(),
        name: record.name,
        school: record.school,
        age: record.age,
        address: record.address,
        phone: record.phone,
        shape: record.shape,
        type: record.type,
        parameters: params, // pass object directly for jsonb
        result: record.result
      });
    if (error) throw error;
  } catch (e) {
    console.error('Supabase save failed', e.message);
  }

  res.render('result', { record });
});

app.get('/dashboard', async (req, res) => {
  // Baca statistik dari Supabase dengan pengurutan opsional untuk tabel "terbaru"
  const allowedSort = { name: 'name', school: 'school', age: 'age', timestamp: 'timestamp' };
  const sort = req.query.sort && allowedSort[req.query.sort] ? req.query.sort : 'timestamp';
  const order = (req.query.order && req.query.order.toLowerCase() === 'asc') ? 'asc' : 'desc';

  try {
    // Statistik per bentuk
    const { data: stats, error: statsError } = await supabase
      .from('calculations')
      .select('shape, type, cnt: count(*), avg_result: avg(result), min_result: min(result), max_result: max(result)')
      .group('shape, type');
    if (statsError) throw statsError;

    // Total perhitungan
    const { count: totalCount, error: countError } = await supabase
      .from('calculations')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;

    // 20 catatan terakhir dengan pengurutan yang diminta
    const { data: last, error: lastError } = await supabase
      .from('calculations')
      .select('*')
      .order(sort, { ascending: order === 'asc' })
      .limit(20);
    if (lastError) throw lastError;

    // Mengelompokkan statistik berdasarkan kategori bentuk
    // Bangun Datar: persegi, segitiga, lingkaran
    // Bangun Ruang: kubus, limas, tabung
    // Hitung total per kategori untuk persentase
    const flatShapes = ['persegi','segitiga','lingkaran'];
    const spaceShapes = ['kubus','limas','tabung'];
    const counts = {};
    stats.forEach(r => { counts[r.shape] = r.cnt; });

    const flatTotal = flatShapes.reduce((s, sh) => s + (counts[sh] || 0), 0);
    const spaceTotal = spaceShapes.reduce((s, sh) => s + (counts[sh] || 0), 0);

    const categoryStats = {
      flat: flatShapes.map(sh => ({ shape: sh, count: counts[sh] || 0, percent: flatTotal ? +( (counts[sh]||0) / flatTotal * 100 ).toFixed(1) : 0 })),
      space: spaceShapes.map(sh => ({ shape: sh, count: counts[sh] || 0, percent: spaceTotal ? +( (counts[sh]||0) / spaceTotal * 100 ).toFixed(1) : 0 }))
    };

    res.render('dashboard', { stats, totals: totalCount, last, sort, order, categoryStats });
  } catch (e) {
    console.error('Supabase read failed', e.message);
    res.render('dashboard', { stats: [], totals: 0, last: [], sort: 'timestamp', order: 'desc' });
  }
});

app.get('/download-csv', (req, res) => {
  if (!fs.existsSync(CSV_PATH)) return res.status(404).send('CSV not found');
  res.download(CSV_PATH, 'records.csv');
});

// API untuk mendapatkan info CSV (ada/tidak, ukuran, waktu modifikasi, jumlah baris)
app.get('/api/csv-info', (req, res) => {
  try {
    if (!fs.existsSync(CSV_PATH)) return res.json({ exists: false });
    const stat = fs.statSync(CSV_PATH);
    let rows = null;
    try {
      const data = fs.readFileSync(CSV_PATH, 'utf8');
      if (data.trim().length === 0) rows = 0;
      else rows = data.split('\n').filter(l => l.trim().length > 0).length - 1; // minus header
    } catch (e) {
      rows = null;
    }

    return res.json({
      exists: true,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      rows
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ ok: true }));

// Mulai server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
