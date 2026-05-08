# Fetch Climate Edge Function

This Edge Function fetches weather data from the Open-Meteo API for all districts and saves climate snapshots to the database.

## Features

- Fetches current weather data for all districts from Open-Meteo API
- Calculates flood risk scores based on multiple weather factors
- Maps weather codes to human-readable conditions
- Saves climate snapshots to the `climate_snapshots` table
- Automatically triggers climate-based alerts via database triggers
- Handles errors gracefully and provides detailed logging

## Weather Data Collected

- **Temperature**: Current temperature in Celsius
- **Humidity**: Relative humidity percentage
- **Rainfall**: Current precipitation in mm
- **Wind Speed**: Wind speed in km/h
- **Weather Condition**: Mapped from weather codes (clear, cloudy, rainy, stormy, foggy, windy)
- **Flood Risk Score**: Calculated score from 0-100 based on multiple factors

## Flood Risk Calculation

The flood risk score (0-100) is calculated based on:

- **Current Rainfall** (0-40 points): Immediate precipitation levels
- **Daily Rainfall** (0-30 points): 24-hour accumulated precipitation
- **Weekly Rainfall** (0-20 points): 7-day accumulated precipitation
- **Humidity** (0-5 points): High humidity increases flood risk
- **Wind Speed** (0-5 points): Strong winds can worsen flooding conditions

## Usage

### Manual Invocation

```bash
# Deploy the function
supabase functions deploy fetch-climate

# Invoke the function
curl -X POST 'https://your-project.supabase.co/functions/v1/fetch-climate' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Scheduled Invocation

You can set up a cron job or use Supabase's scheduled functions to run this automatically:

```sql
-- Example: Run every hour
SELECT cron.schedule('fetch-climate-hourly', '0 * * * *', 'https://your-project.supabase.co/functions/v1/fetch-climate');
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully fetched and saved climate data for 18 districts",
  "snapshots": [...],
  "errors": []
}
```

**Error Response:**
```json
{
  "error": "Failed to save climate data",
  "details": "Error message",
  "partialSuccess": 15,
  "errors": ["Failed to fetch weather data for District X"]
}
```

## Environment Variables

The function requires these Supabase environment variables (automatically available):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

## API Dependencies

- **Open-Meteo API**: Free weather API (no API key required)
  - Endpoint: `https://api.open-meteo.com/v1/forecast`
  - Rate limits: 10,000 requests per day for non-commercial use
  - Documentation: https://open-meteo.com/en/docs

## Database Integration

The function:

1. Fetches all districts from the `districts` table
2. Calls Open-Meteo API for each district's coordinates
3. Processes weather data and calculates flood risk scores
4. Inserts climate snapshots into `climate_snapshots` table
5. Database triggers automatically generate alerts for high-risk conditions

## Error Handling

- Gracefully handles API failures for individual districts
- Continues processing other districts if some fail
- Returns partial success information
- Logs detailed error information for debugging

## Monitoring

Monitor the function through:

- Supabase Dashboard > Edge Functions > fetch-climate
- Database logs in `climate_snapshots` table
- Generated alerts in `alerts` table for high-risk conditions

## Development

To test locally:

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve fetch-climate

# Test the function
curl -X POST 'http://localhost:54321/functions/v1/fetch-climate' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```