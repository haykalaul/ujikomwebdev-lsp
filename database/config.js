const mysql = require('mysql2/promise');

// Local MySQL Database Configuration
const localDb = mysql.createPool({
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

// Supabase MySQL Database Configuration
const supabaseDb = mysql.createPool({
  host: process.env.SUPABASE_DB_HOST,
  port: process.env.SUPABASE_DB_PORT || 3306,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASS,
  database: process.env.SUPABASE_DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  acquireTimeout: 30000,
  timeout: 30000,
  ssl: process.env.SUPABASE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Test database connections
async function testConnections() {
  try {
    // Test local database
    const localConn = await localDb.getConnection();
    console.log('✅ Local MySQL database connected successfully');
    localConn.release();

    // Test Supabase database if configured
    if (process.env.SUPABASE_DB_HOST) {
      const supabaseConn = await supabaseDb.getConnection();
      console.log('✅ Supabase MySQL database connected successfully');
      supabaseConn.release();
    } else {
      console.log('⚠️  Supabase database not configured - set SUPABASE_DB_HOST to enable');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Sync functions
async function syncToSupabase() {
  let localConn, supabaseConn;

  try {
    console.log('🔄 Starting sync to Supabase...');

    // Get last sync timestamp
    let lastSyncTime = new Date(0); // Default to epoch if no previous sync

    try {
      const [syncRows] = await supabaseDb.execute(
        'SELECT sync_time FROM sync_log ORDER BY sync_time DESC LIMIT 1'
      );
      if (syncRows.length > 0) {
        lastSyncTime = new Date(syncRows[0].sync_time);
      }
    } catch (error) {
      // sync_log table might not exist yet
      console.log('📝 sync_log table not found, will create it');
    }

    // Get new records from local database
    localConn = await localDb.getConnection();
    const [newRecords] = await localConn.execute(
      'SELECT * FROM calculations WHERE timestamp > ? ORDER BY timestamp ASC',
      [lastSyncTime]
    );

    if (newRecords.length === 0) {
      console.log('✅ No new records to sync');
      return { success: true, syncedRecords: 0 };
    }

    console.log(`📊 Found ${newRecords.length} new records to sync`);

    // Insert records to Supabase
    supabaseConn = await supabaseDb.getConnection();

    // Ensure calculations table exists in Supabase
    await supabaseConn.execute(`
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
        result DOUBLE,
        INDEX idx_timestamp (timestamp),
        INDEX idx_shape (shape)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Insert records in batches
    const batchSize = 100;
    let syncedCount = 0;

    for (let i = 0; i < newRecords.length; i += batchSize) {
      const batch = newRecords.slice(i, i + batchSize);
      const values = batch.map(record => [
        record.timestamp,
        record.name,
        record.school,
        record.age,
        record.address,
        record.phone,
        record.shape,
        record.type,
        record.parameters,
        record.result
      ]);

      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const query = `
        INSERT INTO calculations (timestamp, name, school, age, address, phone, shape, type, parameters, result)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          school = VALUES(school),
          age = VALUES(age),
          address = VALUES(address),
          phone = VALUES(phone),
          shape = VALUES(shape),
          type = VALUES(type),
          parameters = VALUES(parameters),
          result = VALUES(result)
      `;

      await supabaseConn.execute(query, values.flat());
      syncedCount += batch.length;
      console.log(`📦 Synced batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
    }

    // Log the sync operation
    await supabaseConn.execute(
      'CREATE TABLE IF NOT EXISTS sync_log (id INT AUTO_INCREMENT PRIMARY KEY, sync_time DATETIME NOT NULL, records_synced INT, status VARCHAR(20))'
    );

    await supabaseConn.execute(
      'INSERT INTO sync_log (sync_time, records_synced, status) VALUES (?, ?, ?)',
      [new Date(), syncedCount, 'success']
    );

    console.log(`✅ Successfully synced ${syncedCount} records to Supabase`);
    return { success: true, syncedRecords: syncedCount };

  } catch (error) {
    console.error('❌ Sync to Supabase failed:', error.message);

    // Log failed sync
    try {
      if (supabaseConn) {
        await supabaseConn.execute(
          'INSERT INTO sync_log (sync_time, records_synced, status) VALUES (?, ?, ?)',
          [new Date(), 0, 'failed']
        );
      }
    } catch (logError) {
      console.error('Failed to log sync error:', logError.message);
    }

    return { success: false, error: error.message };
  } finally {
    if (localConn) localConn.release();
    if (supabaseConn) supabaseConn.release();
  }
}

// Get sync status
async function getSyncStatus() {
  try {
    // Get local database stats
    const [localStats] = await localDb.execute(
      'SELECT COUNT(*) as total, MAX(timestamp) as last_record FROM calculations'
    );

    // Get Supabase database stats
    let supabaseStats = { total: 0, last_record: null };
    try {
      const [supabaseResult] = await supabaseDb.execute(
        'SELECT COUNT(*) as total, MAX(timestamp) as last_record FROM calculations'
      );
      supabaseStats = supabaseResult[0];
    } catch (error) {
      console.log('Could not get Supabase stats:', error.message);
    }

    // Get last sync log
    let lastSync = null;
    try {
      const [syncLog] = await supabaseDb.execute(
        'SELECT * FROM sync_log ORDER BY sync_time DESC LIMIT 1'
      );
      lastSync = syncLog[0];
    } catch (error) {
      console.log('Could not get sync log:', error.message);
    }

    return {
      local: localStats[0],
      supabase: supabaseStats,
      lastSync: lastSync,
      isConfigured: !!(process.env.SUPABASE_DB_HOST)
    };
  } catch (error) {
    console.error('Error getting sync status:', error.message);
    return { error: error.message };
  }
}

module.exports = {
  localDb,
  supabaseDb,
  testConnections,
  syncToSupabase,
  getSyncStatus
};
