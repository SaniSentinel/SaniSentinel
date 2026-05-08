# Supabase CLI Testing Setup Guide

## 1. Install Supabase CLI

### Option A: Using npm (if you have Node.js)
```bash
# Note: Global installation is not supported, use npx instead
npx supabase --version
```

### Option B: Using Chocolatey (Windows)
```powershell
# Install Chocolatey first if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Supabase CLI
choco install supabase
```

### Option C: Using Scoop (Windows)
```powershell
# Install Scoop first if not installed
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option D: Direct Download
1. Go to https://github.com/supabase/cli/releases/latest
2. Download `supabase_windows_amd64.zip`
3. Extract and add to your PATH

## 2. Initialize Local Supabase Project

```bash
# Initialize Supabase in your project
supabase init

# Start local Supabase services
supabase start

# This will start:
# - PostgreSQL database
# - Supabase Studio (dashboard)
# - Edge Functions runtime
# - Auth server
# - Storage server
```

## 3. Link to Remote Project (Optional)

```bash
# Link to your remote Supabase project
supabase link --project-ref aaxgfnzcbyerjlcftwuo

# Pull remote schema
supabase db pull
```

## 4. Serve Edge Functions Locally

```bash
# Serve all edge functions locally
supabase functions serve

# Or serve specific function
supabase functions serve fetch-climate

# Functions will be available at:
# http://localhost:54321/functions/v1/{function-name}
```

## 5. Run Tests

```bash
# Run the comprehensive test suite
node test-edge-functions.js

# Or test individual functions manually
curl -X POST http://localhost:54321/functions/v1/fetch-climate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 6. Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy fetch-climate

# Deploy with environment variables
supabase secrets set AFRICAS_TALKING_API_KEY=your_api_key
supabase functions deploy
```

## 7. Monitor Logs

```bash
# View function logs
supabase functions logs fetch-climate

# Follow logs in real-time
supabase functions logs fetch-climate --follow
```

## Troubleshooting

### Common Issues:

1. **Docker not running**: Make sure Docker Desktop is installed and running
2. **Port conflicts**: Stop other services using ports 54321, 54322, etc.
3. **Permission errors**: Run terminal as administrator on Windows
4. **Network issues**: Check firewall settings

### Reset Local Environment:

```bash
# Stop all services
supabase stop

# Reset database
supabase db reset

# Start fresh
supabase start
```

## Environment Variables for Local Testing

Create a `.env.local` file in your project root:

```env
# Local Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Africa's Talking API (same as production)
AFRICAS_TALKING_API_KEY=atsk_56cc647e4593a9b12d5d85db3d9f2746f4c23a7bd297d9f90e1827a8245520adaaeab07b
AFRICAS_TALKING_USERNAME=sandbox
```