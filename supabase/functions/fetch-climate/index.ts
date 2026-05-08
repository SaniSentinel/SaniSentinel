import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface District {
  id: string
  name: string
  region: string
  lat: number
  lng: number
}

interface WeatherData {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    precipitation: number
    wind_speed_10m: number
    weather_code: number
  }
  daily: {
    precipitation_sum: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

interface ClimateSnapshot {
  district_id: string
  flood_risk_score: number
  rainfall_mm: number
  temperature_celsius: number
  humidity_percent: number
  wind_speed_kmh: number
  weather_condition: string
}

// Weather code mapping for Open-Meteo API
function getWeatherCondition(weatherCode: number): string {
  if (weatherCode === 0) return 'clear'
  if (weatherCode >= 1 && weatherCode <= 3) return 'cloudy'
  if (weatherCode >= 45 && weatherCode <= 48) return 'foggy'
  if (weatherCode >= 51 && weatherCode <= 67) return 'rainy'
  if (weatherCode >= 71 && weatherCode <= 77) return 'rainy'
  if (weatherCode >= 80 && weatherCode <= 82) return 'rainy'
  if (weatherCode >= 85 && weatherCode <= 86) return 'rainy'
  if (weatherCode >= 95 && weatherCode <= 99) return 'stormy'
  return 'cloudy'
}

// Calculate flood risk score based on weather conditions
function calculateFloodRisk(
  currentRainfall: number,
  dailyRainfall: number,
  weeklyRainfall: number,
  humidity: number,
  windSpeed: number
): number {
  let riskScore = 0

  // Current rainfall contribution (0-40 points)
  if (currentRainfall > 50) riskScore += 40
  else if (currentRainfall > 20) riskScore += 25
  else if (currentRainfall > 10) riskScore += 15
  else if (currentRainfall > 5) riskScore += 8

  // Daily rainfall contribution (0-30 points)
  if (dailyRainfall > 100) riskScore += 30
  else if (dailyRainfall > 50) riskScore += 20
  else if (dailyRainfall > 25) riskScore += 12
  else if (dailyRainfall > 10) riskScore += 6

  // Weekly rainfall contribution (0-20 points)
  if (weeklyRainfall > 200) riskScore += 20
  else if (weeklyRainfall > 100) riskScore += 15
  else if (weeklyRainfall > 50) riskScore += 10
  else if (weeklyRainfall > 25) riskScore += 5

  // Humidity contribution (0-5 points)
  if (humidity > 85) riskScore += 5
  else if (humidity > 75) riskScore += 3

  // Wind speed contribution (0-5 points)
  if (windSpeed > 30) riskScore += 5
  else if (windSpeed > 20) riskScore += 3

  return Math.min(riskScore, 100)
}

async function fetchWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=GMT&past_days=7&forecast_days=1`
    
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Weather API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    return data as WeatherData
  } catch (error) {
    console.error('Error fetching weather data:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all districts
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('id, name, region, lat, lng')

    if (districtsError) {
      console.error('Error fetching districts:', districtsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch districts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!districts || districts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No districts found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const climateSnapshots: ClimateSnapshot[] = []
    const errors: string[] = []

    // Fetch weather data for each district
    for (const district of districts as District[]) {
      console.log(`Fetching weather data for ${district.name}...`)
      
      const weatherData = await fetchWeatherData(district.lat, district.lng)
      
      if (!weatherData) {
        errors.push(`Failed to fetch weather data for ${district.name}`)
        continue
      }

      // Calculate weekly rainfall sum from past 7 days
      const weeklyRainfall = weatherData.daily.precipitation_sum
        .slice(0, 7)
        .reduce((sum, rain) => sum + (rain || 0), 0)

      // Get today's rainfall (last item in daily array)
      const dailyRainfall = weatherData.daily.precipitation_sum[weatherData.daily.precipitation_sum.length - 1] || 0

      // Calculate flood risk score
      const floodRiskScore = calculateFloodRisk(
        weatherData.current.precipitation || 0,
        dailyRainfall,
        weeklyRainfall,
        weatherData.current.relative_humidity_2m || 0,
        weatherData.current.wind_speed_10m || 0
      )

      const climateSnapshot: ClimateSnapshot = {
        district_id: district.id,
        flood_risk_score: floodRiskScore,
        rainfall_mm: weatherData.current.precipitation || 0,
        temperature_celsius: weatherData.current.temperature_2m || 0,
        humidity_percent: Math.round(weatherData.current.relative_humidity_2m || 0),
        wind_speed_kmh: weatherData.current.wind_speed_10m || 0,
        weather_condition: getWeatherCondition(weatherData.current.weather_code || 0)
      }

      climateSnapshots.push(climateSnapshot)
    }

    // Insert climate snapshots into database
    if (climateSnapshots.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('climate_snapshots')
        .insert(climateSnapshots)
        .select()

      if (insertError) {
        console.error('Error inserting climate snapshots:', insertError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to save climate data', 
            details: insertError.message,
            partialSuccess: climateSnapshots.length,
            errors 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`Successfully saved ${climateSnapshots.length} climate snapshots`)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Successfully fetched and saved climate data for ${climateSnapshots.length} districts`,
          snapshots: insertedData,
          errors: errors.length > 0 ? errors : undefined
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'No climate data could be fetched',
          errors 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})