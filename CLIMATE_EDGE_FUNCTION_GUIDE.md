# Climate Data Edge Function - Complete Implementation Guide

## 🌤️ Overview

The `fetch-climate` Edge Function automatically fetches weather data from the Open-Meteo API for all districts and saves climate snapshots to your database. It calculates flood risk scores and integrates with your existing alert system.

## 📁 Files Created

### Edge Function Core
- `supabase/functions/fetch-climate/index.ts` - Main Edge Function code
- `supabase/functions/fetch-climate/deno.json` - Deno configuration
- `supabase/functions/fetch-climate/README.md` - Detailed documentation

### Deployment & Testing
- `supabase/functions/fetch-climate/deploy.sh` - Bash deployment script
- `supabase/functions/fetch-climate/deploy.ps1` - PowerShell deployment script
- `supabase/functions/fetch-climate/test.ts` - Test script for the function

### Client Integration
- `src/lib/climate-fetch.js` - Client-side utilities for calling the Edge Function
- `src/components/ClimateDataFetcher.jsx` - React component for managing climate data

## 🚀 Quick Start

### 1. Deploy the Edge Function

**Option A: Using PowerShell (Windows)**
```powershell
cd supabase/functions/fetch-climate
.\deploy.ps1 local
```

**Option B: Using Bash**
```bash
cd supabase/functions/fetch-climate
./deploy.sh local
```

**Option C: Manual Deployment**
```bash
# For local development
supabase functions serve fetch-climate

# For production
supabase functions deploy fetch-climate
```

### 2. Test the Function

```bash
# Test locally
curl -X POST 'http://localhost:54321/functions/v1/fetch-climate' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Or use the test script
deno run --allow-net --allow-env supabase/functions/fetch-climate/test.ts
```

### 3. Use in Your React App

```jsx
import { ClimateDataFetcher } from './components'

function App() {
  return (
    <div>
      <ClimateDataFetcher />
    </div>
  )
}
```

## 🔧 Features

### Weather Data Collection
- **Temperature**: Current temperature in Celsius
- **Humidity**: Relative humidity percentage  
- **Rainfall**: Current precipitation in mm
- **Wind Speed**: Wind speed in km/h
- **Weather Condition**: Clear, cloudy, rainy, stormy, foggy, windy

### Flood Risk Calculation
The function calculates a flood risk score (0-100) based on:
- **Current Rainfall** (0-40 points): Immediate precipitation
- **Daily Rainfall** (0-30 points): 24-hour accumulated precipitation  
- **Weekly Rainfall** (0-20 points): 7-day accumulated precipitation
- **Humidity** (0-5 points): High humidity increases risk
- **Wind Speed** (0-5 points): Strong winds worsen conditions

### Automatic Alerts
The database triggers automatically generate alerts when:
- Flood risk score ≥ 70 (climate warnings)
- Rainfall > 50mm in single reading (heavy rainfall alerts)
- Stormy conditions with wind > 40 km/h (storm warnings)

## 📊 API Integration

### Open-Meteo API
- **Free tier**: 10,000 requests/day
- **No API key required**
- **Rate limits**: Generous for non-commercial use
- **Documentation**: https://open-meteo.com/en/docs

### Data Points Fetched
```javascript
const apiUrl = `https://api.open-meteo.com/v1/forecast?
  latitude=${lat}&longitude=${lng}&
  current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&
  daily=precipitation_sum,temperature_2m_max,temperature_2m_min&
  timezone=GMT&past_days=7&forecast_days=1`
```

## 🔄 Automation Options

### 1. Scheduled Edge Function (Recommended)
```sql
-- Run every hour
SELECT cron.schedule(
  'fetch-climate-hourly', 
  '0 * * * *', 
  'https://your-project.supabase.co/functions/v1/fetch-climate'
);
```

### 2. Client-Side Auto-Update
```javascript
import { setupAutoClimateUpdates } from './lib/climate-fetch'

// Update every 60 minutes
const intervalId = setupAutoClimateUpdates(60)

// Stop auto-updates
clearInterval(intervalId)
```

### 3. Manual Triggering
```javascript
import { fetchClimateData } from './lib/climate-fetch'

const result = await fetchClimateData()
if (result.success) {
  console.log('Climate data updated!')
}
```

## 📈 Data Access

### Get Current Weather
```javascript
import { getCurrentWeatherConditions } from './lib/climate-fetch'

const currentWeather = await getCurrentWeatherConditions()
```

### Get High-Risk Districts
```javascript
import { getHighRiskDistricts } from './lib/climate-fetch'

const highRisk = await getHighRiskDistricts()
```

### Get District History
```javascript
import { getDistrictClimateHistory } from './lib/climate-fetch'

const history = await getDistrictClimateHistory(districtId, 7) // Last 7 days
```

## 🛠️ Database Integration

### Tables Used
- **districts**: Source of coordinates for API calls
- **climate_snapshots**: Storage for weather data
- **alerts**: Automatic alert generation for high-risk conditions

### Views Available
- **current_weather**: Latest weather conditions per district

### Functions Available
- **get_latest_climate_data()**: Get current conditions for all districts
- **calculate_flood_risk()**: Manual flood risk calculation
- **generate_climate_alerts()**: Trigger function for alerts

## 🔍 Monitoring

### Edge Function Logs
- Check Supabase Dashboard > Edge Functions > fetch-climate
- Monitor execution time and error rates
- View detailed logs for debugging

### Database Monitoring
```sql
-- Check latest climate data
SELECT * FROM current_weather ORDER BY flood_risk_score DESC;

-- Check recent alerts
SELECT * FROM alerts WHERE alert_type = 'climate_warning' 
ORDER BY created_at DESC LIMIT 10;

-- Monitor function performance
SELECT 
  DATE_TRUNC('hour', recorded_at) as hour,
  COUNT(*) as snapshots_created
FROM climate_snapshots 
WHERE recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

## 🚨 Error Handling

The function handles various error scenarios:
- **API failures**: Continues with other districts
- **Database errors**: Returns detailed error information
- **Network issues**: Graceful degradation
- **Invalid data**: Validation and sanitization

### Common Issues

1. **"No districts found"**
   - Ensure districts table has data
   - Check RLS policies

2. **"Weather API error"**
   - Check internet connectivity
   - Verify coordinates are valid
   - Monitor API rate limits

3. **"Failed to save climate data"**
   - Check database permissions
   - Verify table schema matches
   - Review RLS policies

## 🔐 Security

### Environment Variables
- `SUPABASE_URL`: Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY`: Automatically provided

### Row Level Security
- Climate snapshots have RLS enabled
- System can insert data via service role
- Users can read all climate data

### API Security
- CORS headers configured
- Input validation and sanitization
- Error messages don't expose sensitive data

## 📝 Next Steps

1. **Set up automated scheduling** using Supabase cron
2. **Monitor the function** through dashboard logs
3. **Customize alert thresholds** in the database triggers
4. **Add more weather parameters** if needed
5. **Implement data retention policies** for old snapshots

## 🤝 Contributing

To extend the function:
1. Modify `supabase/functions/fetch-climate/index.ts`
2. Update the flood risk calculation logic
3. Add new weather parameters
4. Test with `test.ts` script
5. Deploy using the provided scripts

## 📚 Resources

- [Open-Meteo API Documentation](https://open-meteo.com/en/docs)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Weather Code Reference](https://open-meteo.com/en/docs#weathervariables)

---

**🎉 Your climate data Edge Function is ready to use!** The function will automatically fetch weather data, calculate flood risks, and generate alerts to help protect sanitation facilities across all districts.