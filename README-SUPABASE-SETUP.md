# Supabase MySQL Integration Setup Guide

## Overview
This Express.js application now supports dual database setup with local MySQL and Supabase MySQL integration. The system provides automatic and manual data synchronization between your local database and Supabase cloud database.

## Features Implemented

### ✅ Database Integration
- **Dual Database Support**: Local MySQL + Supabase MySQL
- **Connection Pooling**: Optimized connections for both databases
- **Error Handling**: Comprehensive error handling and recovery
- **Connection Testing**: Automatic connection validation on startup

### ✅ Data Synchronization
- **Incremental Sync**: Only syncs new/changed records to avoid duplicates
- **Automatic Sync**: Configurable auto-sync every X minutes
- **Manual Sync**: API endpoint for on-demand synchronization
- **Batch Processing**: Efficient batch processing for large datasets
- **Sync Logging**: Complete sync history and status tracking

### ✅ API Endpoints
- `POST /api/sync-to-supabase` - Manual sync trigger
- `GET /api/sync-status` - Get current sync status
- `GET /api/data-comparison` - Compare local vs Supabase data
- `GET /health` - Health check endpoint

### ✅ Monitoring & Logging
- **Real-time Logging**: Detailed sync operation logs
- **Error Tracking**: Failed sync attempts are logged
- **Performance Monitoring**: Sync performance metrics
- **Status Dashboard**: Visual sync status information

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Local MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_local_mysql_password
DB_NAME=luas_volume_db

# Supabase MySQL Database Configuration
SUPABASE_DB_HOST=your-supabase-host.mysql.database.azure.com
SUPABASE_DB_PORT=3306
SUPABASE_DB_USER=your_supabase_username
SUPABASE_DB_PASS=your_supabase_password
SUPABASE_DB_NAME=your_supabase_database_name
SUPABASE_DB_SSL=true

# Application Configuration
PORT=3000
CSV_PATH=./data/records.csv

# Sync Configuration
AUTO_SYNC_INTERVAL_MINUTES=5
```

### 2. Supabase MySQL Setup

1. **Create Supabase Project**: Go to [Supabase Dashboard](https://supabase.com) and create a new project
2. **Enable MySQL**: In your Supabase project settings, enable MySQL database
3. **Get Connection Details**: From Supabase dashboard, get your MySQL connection details:
   - Host (e.g., `your-project.mysql.database.azure.com`)
   - Username
   - Password
   - Database name
   - Port (usually 3306)

4. **Configure SSL**: Set `SUPABASE_DB_SSL=true` for secure connections

### 3. Start the Application

```bash
npm start
```

The application will:
- Test connections to both databases
- Create necessary tables in Supabase if they don't exist
- Start auto-sync if configured
- Begin accepting requests

## Usage Guide

### Manual Sync
Trigger a manual sync via API:
```bash
curl -X POST http://localhost:3000/api/sync-to-supabase
```

### Check Sync Status
```bash
curl http://localhost:3000/api/sync-status
```

### Data Comparison
Compare data between local and Supabase:
```bash
curl http://localhost:3000/api/data-comparison
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Sync Configuration

### Auto-Sync Interval
Set `AUTO_SYNC_INTERVAL_MINUTES` in your `.env` file:
- Default: 5 minutes
- Minimum: 1 minute
- Maximum: 1440 minutes (24 hours)

### Sync Behavior
- **Incremental**: Only syncs records newer than the last sync
- **Batch Processing**: Processes records in batches of 100 for efficiency
- **Error Recovery**: Failed syncs are logged but don't stop the application
- **Duplicate Prevention**: Uses `ON DUPLICATE KEY UPDATE` to handle conflicts

## Monitoring

### Logs
The application provides detailed logging:
- ✅ Successful connections
- 🔄 Sync operations
- 📊 Records synced
- ❌ Errors and failures
- 📝 Sync history

### Sync Status Response
```json
{
  "success": true,
  "data": {
    "local": {
      "total": 150,
      "last_record": "2024-01-15T10:30:00.000Z"
    },
    "supabase": {
      "total": 145,
      "last_record": "2024-01-15T10:25:00.000Z"
    },
    "lastSync": {
      "id": 1,
      "sync_time": "2024-01-15T10:25:00.000Z",
      "records_synced": 5,
      "status": "success"
    },
    "isConfigured": true
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify Supabase credentials in `.env`
   - Check if Supabase MySQL is enabled
   - Ensure SSL is properly configured

2. **Sync Not Working**
   - Check if local database has data
   - Verify sync logs in console
   - Check API response for error details

3. **Performance Issues**
   - Reduce `AUTO_SYNC_INTERVAL_MINUTES`
   - Check database connection limits
   - Monitor memory usage

### Debug Mode
Add to your `.env`:
```env
DEBUG=true
```

This will enable verbose logging for troubleshooting.

## Security Considerations

1. **Environment Variables**: Never commit `.env` file to version control
2. **SSL**: Always use SSL for Supabase connections
3. **Credentials**: Use strong passwords and rotate regularly
4. **Network**: Restrict database access to necessary IP ranges

## Performance Tips

1. **Batch Size**: Current batch size is 100 records - adjust if needed
2. **Sync Interval**: Balance between real-time sync and resource usage
3. **Connection Pooling**: Monitor connection pool usage
4. **Indexes**: Ensure proper indexing on sync timestamp fields

## Support

For issues or questions:
1. Check the logs in your console
2. Verify your Supabase configuration
3. Test API endpoints individually
4. Check the TODO.md file for implementation details

## Next Steps

- Monitor sync performance in production
- Consider implementing sync conflict resolution
- Add data backup before major sync operations
- Implement sync history dashboard
- Add email notifications for sync failures
