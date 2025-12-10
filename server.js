require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { localDb, testConnections, syncToSupabase, getSyncStatus } = require('./db');

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
  try {
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
  } catch (error) {
    console.error('CSV append error:', error);
    throw error;
  }
}

// Setup pengkoneksian MySQL Server dengan error handling yang lebih baik
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'luas_volume_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

async function ensureTable() {
  let conn;
  try {
    const create = `
    CREATE TABLE IF NOT EXISTS calculations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      timestamp DATETIME NOT NULL,
      name VARCHAR(255),
      school VARCHAR(255),
      age INT,
      address TEXT,
      phone VARCHAR(50),
      shape VARCHAR(50),
      type VARCHAR(20),
      parameters JSON,
      result DOUBLE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    conn = await pool.getConnection();
    await conn.query(create);
    console.log('Database table ensured successfully');
  } catch (err) {
    console.error('DB table ensure failed:', err.message);
  } finally {
    if (conn) conn.release();
  }
}

// Initialize database table
ensureTable();

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

// Error handling middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  try {
    res.render('landing');
  } catch (error) {
    console.error('Landing page render error:', error);
    res.status(500).send('Error loading landing page');
  }
});

// Serve form at /form
app.get('/form', (req, res) => {
  try {
    res.render('form');
  } catch (error) {
    console.error('Form page render error:', error);
    res.status(500).send('Error loading form page');
  }
});

app.post('/calculate', async (req, res) => {
  let conn;
  try {
    const { name, school, age, address, phone, shape } = req.body;
    
    // Validasi input dasar
    if (!shape) {
      return res.status(400).send('Shape is required');
    }

    // Kumpulkan parameter yang relevan tergantung pada bentuk
    const params = {};
    ['s','a','t','r','h'].forEach(k => { 
      if (req.body[k]) params[k] = req.body[k]; 
    });

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

    // Menyimpan ke DB
    try {
      conn = await pool.getConnection();
      const q = `INSERT INTO calculations (timestamp,name,school,age,address,phone,shape,type,parameters,result) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await conn.query(q, [timestamp, record.name, record.school, record.age, record.address, record.phone, record.shape, record.type, record.parameters, record.result]);
    } catch (e) {
      console.error('DB save failed', e.message);
    } finally {
      if (conn) conn.release();
    }

    res.render('result', { record });
  } catch (error) {
    console.error('Calculate error:', error);
    if (conn) conn.release();
    res.status(500).send('Error processing calculation');
  }
});

app.get('/dashboard', async (req, res) => {
  let conn;
  try {
    console.log('Dashboard route accessed');
    
    // Baca statistik dari DB dengan pengurutan opsional untuk tabel "terbaru"
    const allowedSort = { name: 'name', school: 'school', age: 'age', timestamp: 'timestamp' };
    const sort = req.query.sort && allowedSort[req.query.sort] ? req.query.sort : 'timestamp';
    const order = (req.query.order && req.query.order.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    // Default data structure in case of database error
    const defaultData = {
      stats: [],
      totals: 0,
      last: [],
      sort: sort,
      order: order.toLowerCase(),
      categoryStats: {
        flat: [
          { shape: 'persegi', count: 0, percent: 0 },
          { shape: 'segitiga', count: 0, percent: 0 },
          { shape: 'lingkaran', count: 0, percent: 0 }
        ],
        space: [
          { shape: 'kubus', count: 0, percent: 0 },
          { shape: 'limas', count: 0, percent: 0 },
          { shape: 'tabung', count: 0, percent: 0 }
        ]
      }
    };

    try {
      conn = await pool.getConnection();
      console.log('Database connection established');

      // Test database connection
      await conn.query('SELECT 1');
      console.log('Database query test successful');

      const [rows] = await conn.query('SELECT shape, type, COUNT(*) as cnt, AVG(result) as avg_result, MIN(result) as min_result, MAX(result) as max_result FROM calculations GROUP BY shape, type');
      console.log('Stats query successful, rows:', rows.length);

      // total perhitungan per bentuk
      const [totals] = await conn.query('SELECT COUNT(*) as total FROM calculations');
      console.log('Totals query successful:', totals[0].total);

      // 20 catatan terakhir dengan pengurutan yang diminta
      const orderBy = allowedSort[sort];
      const q = `SELECT * FROM calculations ORDER BY ${orderBy} ${order} LIMIT 20`;
      const [last] = await conn.query(q);
      console.log('Last records query successful, records:', last.length);

      // Mengelompokkan statistik berdasarkan kategori bentuk
      // Bangun Datar: persegi, segitiga, lingkaran
      // Bangun Ruang: kubus, limas, tabung
      // Hitung total per kategori untuk persentase
      const flatShapes = ['persegi','segitiga','lingkaran'];
      const spaceShapes = ['kubus','limas','tabung'];
      const counts = {};
      rows.forEach(r => { counts[r.shape] = r.cnt; });

      const flatTotal = flatShapes.reduce((s, sh) => s + (counts[sh] || 0), 0);
      const spaceTotal = spaceShapes.reduce((s, sh) => s + (counts[sh] || 0), 0);

      const categoryStats = {
        flat: flatShapes.map(sh => ({ 
          shape: sh, 
          count: counts[sh] || 0, 
          percent: flatTotal ? +((counts[sh]||0) / flatTotal * 100).toFixed(1) : 0 
        })),
        space: spaceShapes.map(sh => ({ 
          shape: sh, 
          count: counts[sh] || 0, 
          percent: spaceTotal ? +((counts[sh]||0) / spaceTotal * 100).toFixed(1) : 0 
        }))
      };

      const dashboardData = {
        stats: rows,
        totals: totals[0].total,
        last,
        sort,
        order: order.toLowerCase(),
        categoryStats
      };

      console.log('About to render dashboard with data');
      res.render('dashboard', dashboardData);

    } catch (dbError) {
      console.error('Database error in dashboard:', dbError.message);
      console.log('Rendering dashboard with default data due to DB error');
      res.render('dashboard', defaultData);
    }

  } catch (error) {
    console.error('Dashboard route error:', error);
    console.error('Error stack:', error.stack);
    
    try {
      // Try to render with default data
      res.status(500).render('dashboard', {
        stats: [],
        totals: 0,
        last: [],
        sort: 'timestamp',
        order: 'desc',
        categoryStats: {
          flat: [
            { shape: 'persegi', count: 0, percent: 0 },
            { shape: 'segitiga', count: 0, percent: 0 },
            { shape: 'lingkaran', count: 0, percent: 0 }
          ],
          space: [
            { shape: 'kubus', count: 0, percent: 0 },
            { shape: 'limas', count: 0, percent: 0 },
            { shape: 'tabung', count: 0, percent: 0 }
          ]
        }
      });
    } catch (renderError) {
      console.error('Dashboard render error:', renderError);
      res.status(500).send('Dashboard temporarily unavailable. Please check logs.');
    }
  } finally {
    if (conn) {
      try {
        conn.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

app.get('/download-csv', (req, res) => {
  try {
    if (!fs.existsSync(CSV_PATH)) return res.status(404).send('CSV not found');
    res.download(CSV_PATH, 'records.csv');
  } catch (error) {
    console.error('CSV download error:', error);
    res.status(500).send('Error downloading CSV');
  }
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

// === SUPABASE SYNC API ENDPOINTS ===

// Manual sync to Supabase
app.post('/api/sync-to-supabase', async (req, res) => {
  try {
    console.log('🔄 Manual sync to Supabase initiated');
    const result = await syncToSupabase();

    if (result.success) {
      res.json({
        success: true,
        message: 'Sync completed successfully',
        syncedRecords: result.syncedRecords,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Sync failed',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed due to server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get sync status
app.get('/api/sync-status', async (req, res) => {
  try {
    const status = await getSyncStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get data comparison between local and Supabase
app.get('/api/data-comparison', async (req, res) => {
  try {
    const status = await getSyncStatus();

    if (status.error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get data comparison',
        error: status.error,
        timestamp: new Date().toISOString()
      });
    }

    const comparison = {
      localDatabase: {
        totalRecords: status.local.total,
        lastRecord: status.local.last_record
      },
      supabaseDatabase: {
        totalRecords: status.supabase.total,
        lastRecord: status.supabase.last_record
      },
      syncInfo: {
        lastSync: status.lastSync,
        isConfigured: status.isConfigured,
        recordsDifference: status.local.total - status.supabase.total
      },
      recommendations: []
    };

    // Generate recommendations
    if (!status.isConfigured) {
      comparison.recommendations.push('Configure Supabase database connection in environment variables');
    } else if (status.local.total > status.supabase.total) {
      comparison.recommendations.push('Local database has more records - consider running sync');
    } else if (status.supabase.total > status.local.total) {
      comparison.recommendations.push('Supabase has more records than local - data may be out of sync');
    } else {
      comparison.recommendations.push('Databases appear to be in sync');
    }

    res.json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Data comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data comparison',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).send('Something went wrong!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Auto-sync function
async function startAutoSync() {
  const syncInterval = parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES) || 5; // Default 5 minutes

  if (process.env.SUPABASE_DB_HOST) {
    console.log(`🔄 Auto-sync enabled: running every ${syncInterval} minutes`);

    // Initial sync check
    try {
      const status = await getSyncStatus();
      if (status.local && status.local.total > 0) {
        console.log('📊 Initial sync check: Local database has data, checking if sync needed...');
        const result = await syncToSupabase();
        if (result.success && result.syncedRecords > 0) {
          console.log(`✅ Initial sync completed: ${result.syncedRecords} records synced`);
        }
      }
    } catch (error) {
      console.error('❌ Initial sync failed:', error.message);
    }

    // Set up periodic sync
    setInterval(async () => {
      try {
        console.log('🔄 Running scheduled sync to Supabase...');
        const result = await syncToSupabase();

        if (result.success) {
          if (result.syncedRecords > 0) {
            console.log(`✅ Scheduled sync completed: ${result.syncedRecords} records synced`);
          } else {
            console.log('✅ Scheduled sync completed: No new records to sync');
          }
        } else {
          console.error('❌ Scheduled sync failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Scheduled sync error:', error.message);
      }
    }, syncInterval * 60 * 1000); // Convert minutes to milliseconds
  } else {
    console.log('⚠️  Auto-sync disabled: SUPABASE_DB_HOST not configured');
  }
}

// Mulai server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📊 Environment variables check:');
  console.log('- DB_HOST:', process.env.DB_HOST || 'localhost');
  console.log('- DB_PORT:', process.env.DB_PORT || '3306');
  console.log('- DB_NAME:', process.env.DB_NAME || 'luas_volume_db');
  console.log('- CSV_PATH:', CSV_PATH);

  if (process.env.SUPABASE_DB_HOST) {
    console.log('- SUPABASE_DB_HOST:', process.env.SUPABASE_DB_HOST);
    console.log('- SUPABASE_DB_NAME:', process.env.SUPABASE_DB_NAME);
    console.log('- AUTO_SYNC_INTERVAL_MINUTES:', process.env.AUTO_SYNC_INTERVAL_MINUTES || '5 (default)');
  } else {
    console.log('- SUPABASE_DB_HOST: Not configured');
  }

  // Test database connections
  try {
    await testConnections();
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
  }

  // Start auto-sync if configured
  await startAutoSync();
});