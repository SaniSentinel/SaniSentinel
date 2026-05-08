# Risk Scoring Edge Function - Complete Implementation Guide

## 🎯 Overview

The `score-risk` Edge Function performs comprehensive risk assessment for sanitation facilities by analyzing climate data, facility reports, maintenance history, and location factors. It computes a risk score (0-100) and automatically updates facility status based on the calculated risk level.

## 📁 Files Created

### Edge Function Core
- `supabase/functions/score-risk/index.ts` - Main Edge Function code
- `supabase/functions/score-risk/deno.json` - Deno configuration
- `supabase/functions/score-risk/README.md` - Detailed documentation

### Deployment & Testing
- `supabase/functions/score-risk/deploy.sh` - Bash deployment script
- `supabase/functions/score-risk/deploy.ps1` - PowerShell deployment script
- `supabase/functions/score-risk/test.ts` - Comprehensive test script

### Client Integration
- `src/lib/risk-scoring.js` - Client-side utilities for risk assessment
- `src/components/RiskAssessmentManager.jsx` - React component for risk management

## 🚀 Quick Start

### 1. Deploy the Edge Function

**Option A: Using PowerShell (Windows)**
```powershell
cd supabase/functions/score-risk
.\deploy.ps1 local
```

**Option B: Using Bash**
```bash
cd supabase/functions/score-risk
./deploy.sh local
```

### 2. Test the Function

```bash
# Test locally with all facilities
curl -X POST 'http://localhost:54321/functions/v1/score-risk' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Test with specific facilities
curl -X POST 'http://localhost:54321/functions/v1/score-risk' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"facility_ids": ["uuid1", "uuid2"]}'
```

### 3. Use in Your React App

```jsx
import { RiskAssessmentManager } from './components'

function App() {
  return (
    <div>
      <RiskAssessmentManager />
    </div>
  )
}
```

## 🧮 Risk Calculation Algorithm

The risk score (0-100) combines five key factors:

### 1. Climate Risk (0-30 points)
- Based on district flood risk score from climate snapshots
- Formula: `min(district_flood_risk * 0.3, 30)`
- Higher flood risk increases facility vulnerability
- Default: 15 points if no climate data available

### 2. Facility Condition Risk (0-40 points)
Based on current facility status:
- **Good**: 0 points
- **Damaged**: 25 points  
- **Dry**: 20 points
- **Blocked**: 30 points
- **Overflow**: 40 points
- **Out of Service**: 40 points

### 3. Maintenance Overdue Risk (0-30 points)
Calculated based on facility type and maintenance intervals:

**Maintenance Intervals:**
- **Toilets**: 30 days (monthly)
- **Latrines**: 60 days (bi-monthly)
- **Septic Tanks**: 90 days (quarterly)
- **Treatment Plants**: 14 days (bi-weekly)
- **Waste Collection Points**: 7 days (weekly)

**Risk Scoring:**
- On time: 0 points
- 1x overdue: 10 points
- 2x overdue: 20 points
- 3x+ overdue: 30 points

### 4. Recent Reports Risk (0-20 points)
Analyzes reports from the last 30 days:
- **No reports**: 15 points (lack of monitoring is risky)
- **No recent reports**: 15 points
- **High ratio of bad conditions**: up to 20 points
- **Good condition reports**: 0-5 points

### 5. Location Risk (0-10 points)
Environmental and weather-based risk:
- **High-risk facility types** (septic tanks, treatment plants) in flood-prone areas: +5 points
- **Stormy weather conditions**: +3 points
- **Heavy rainfall** (>50mm): +2 points
- Maximum: 10 points

## 📊 Priority Classification

Facilities are classified into four priority levels:

### Critical (80-100 points) 🚨
- **Action**: Immediate attention required
- **Status**: Should be out of service
- **Description**: Facility poses significant health/safety risk

### High (60-79 points) ⚠️
- **Action**: Urgent attention needed
- **Status**: High risk of failure
- **Description**: Prioritize for immediate maintenance

### Medium (40-59 points) ⚡
- **Action**: Schedule maintenance soon
- **Status**: Moderate risk
- **Description**: Monitor closely and plan repairs

### Low (0-39 points) ✅
- **Action**: Continue regular monitoring
- **Status**: Normal operations
- **Description**: Maintain current schedule

## 🔄 Automated Status Updates

The function automatically updates facility records when:

### Risk Score Changes
- Updates if new risk score differs by ≥5 points from current score
- Maintains audit trail with `updated_at` timestamp

### Status Changes
- Updates status if:
  - New risk score ≥60 AND
  - Recommended status differs from current status
- Preserves existing status for lower-risk facilities

### Recommended Status Logic
```javascript
if (riskScore >= 80) return 'out_of_service'
if (riskScore >= 60) return 'overflow'  
if (riskScore >= 40) return 'damaged'
if (riskScore >= 20) return 'dry'
return 'good'
```

## 📋 Action Recommendations

The function generates specific action recommendations:

### Climate-Based Actions
- **High climate risk** (>15): "Monitor for flood damage and drainage issues"

### Maintenance Actions
- **Overdue maintenance** (>20): "Schedule immediate maintenance inspection"

### Condition Actions
- **Poor condition** (>25): "Repair facility damage and restore functionality"

### Report-Based Actions
- **Bad reports** (>15): "Investigate recurring issues reported by users"

### Priority Actions
- **Critical risk** (≥80): "URGENT: Take facility out of service until repairs completed"
- **High risk** (≥60): "Prioritize this facility for immediate attention"

## 🔗 Integration Points

### Database Dependencies
- **facilities**: Source data and update target
- **climate_snapshots**: Via `get_latest_climate_data()` function
- **reports**: Recent facility condition reports (90 days)
- **districts**: Location data for climate correlation

### API Integration
```javascript
// Run assessment for all facilities
const result = await runRiskAssessment()

// Run assessment for specific facilities
const result = await runRiskAssessment(['uuid1', 'uuid2'])

// Get high-risk facilities
const highRisk = await getHighRiskFacilities()

// Get risk distribution
const distribution = await getRiskDistribution()
```

### Response Format
```json
{
  "success": true,
  "message": "Risk assessment completed for 25 facilities",
  "summary": {
    "total_facilities": 25,
    "facilities_updated": 8,
    "risk_distribution": {
      "critical": 2,
      "high": 5, 
      "medium": 8,
      "low": 10
    },
    "average_risk_score": 42,
    "facilities_needing_attention": 7
  },
  "assessments": [...],
  "updates": {
    "updated_count": 8,
    "errors": 0
  }
}
```

## ⏰ Automation Strategies

### 1. Scheduled Assessment (Recommended)
```sql
-- Run every 6 hours
SELECT cron.schedule(
  'risk-assessment-6h', 
  '0 */6 * * *', 
  'https://your-project.supabase.co/functions/v1/score-risk'
);

-- Run 30 minutes after climate data updates
SELECT cron.schedule(
  'risk-assessment-after-climate', 
  '30 * * * *', 
  'https://your-project.supabase.co/functions/v1/score-risk'
);
```

### 2. Event-Driven Assessment
- Trigger after new reports are submitted
- Run after climate data updates
- Execute after facility status changes

### 3. Client-Side Auto-Assessment
```javascript
// Set up automatic assessment every 6 hours
const intervalId = setupAutoRiskAssessment(6)

// Stop auto-assessment
clearInterval(intervalId)
```

## 📈 Monitoring and Analytics

### Performance Metrics
```sql
-- Facilities by risk level
SELECT 
  CASE 
    WHEN risk_score >= 80 THEN 'Critical'
    WHEN risk_score >= 60 THEN 'High'
    WHEN risk_score >= 40 THEN 'Medium'
    ELSE 'Low'
  END as risk_level,
  COUNT(*) as count
FROM facilities 
GROUP BY risk_level;

-- Average risk by district
SELECT 
  d.name,
  AVG(f.risk_score) as avg_risk,
  COUNT(f.id) as facility_count
FROM facilities f
JOIN districts d ON f.district_id = d.id
GROUP BY d.name
ORDER BY avg_risk DESC;
```

### Alert Integration
```sql
-- High-risk facilities needing attention
SELECT name, risk_score, status, last_serviced
FROM facilities 
WHERE risk_score >= 60 
ORDER BY risk_score DESC;

-- Overdue maintenance by facility type
SELECT 
  type,
  COUNT(*) as overdue_count,
  AVG(risk_score) as avg_risk
FROM facilities 
WHERE last_serviced < CURRENT_DATE - INTERVAL '30 days'
GROUP BY type;
```

## 🛠️ Customization Options

### Adjust Risk Weights
```typescript
// Increase climate risk impact
const climateRisk = climateSnapshot ? Math.min(climateSnapshot.flood_risk_score * 0.4, 40) : 20

// Modify maintenance intervals
const maintenanceIntervals = {
  toilet: 21,           // 3 weeks instead of monthly
  treatment_plant: 7,   // Weekly instead of bi-weekly
}
```

### Custom Status Thresholds
```typescript
// More aggressive status updates
const statusNeedsUpdate = recommendedStatus !== facility.status && totalRiskScore >= 50

// Custom status mapping
function getRecommendedStatus(riskScore, currentStatus) {
  if (riskScore >= 75) return 'out_of_service'  // Lower threshold
  if (riskScore >= 55) return 'overflow'        // Lower threshold
  // ... rest of logic
}
```

### Facility-Specific Actions
```typescript
// Add custom recommendations
if (facility.type === 'treatment_plant' && risk_factors.climate_risk > 20) {
  actions.push('Check flood protection systems and backup power')
}

if (facility.type === 'waste_collection_point' && risk_factors.maintenance_overdue > 15) {
  actions.push('Empty collection point and sanitize area')
}
```

## 🔍 Troubleshooting

### Common Issues

1. **"No facilities found"**
   - Check facilities table has data
   - Verify RLS policies allow access
   - Confirm facility IDs are valid UUIDs

2. **"Could not fetch climate data"**
   - Ensure `get_latest_climate_data()` function exists
   - Check climate_snapshots table has recent data
   - Verify function has proper permissions

3. **"Some facility updates failed"**
   - Check facility table constraints
   - Verify risk_score is within 0-100 range
   - Ensure status values are valid enum values

4. **High execution time**
   - Consider processing facilities in batches
   - Add database indexes on frequently queried columns
   - Optimize climate data queries

### Debug Mode
Enable detailed logging by modifying the function:
```typescript
console.log(`Processing facility: ${facility.name}`)
console.log(`Risk factors:`, riskFactors)
console.log(`Total risk: ${totalRiskScore}`)
```

## 🎯 Best Practices

1. **Run after climate updates**: Schedule 30 minutes after climate data fetch
2. **Monitor execution time**: Optimize for large facility databases
3. **Review risk thresholds**: Adjust based on local conditions and feedback
4. **Validate updates**: Spot-check facility status changes
5. **Alert integration**: Ensure high-risk facilities trigger appropriate notifications
6. **Data quality**: Maintain accurate maintenance records and report data
7. **Regular calibration**: Review and adjust risk calculation weights periodically

## 📚 Next Steps

1. **Deploy the function** using the provided scripts
2. **Set up automated scheduling** with Supabase cron
3. **Integrate with alert system** for high-risk notifications
4. **Monitor facility risk trends** over time
5. **Customize risk weights** based on local conditions
6. **Train staff** on interpreting risk scores and taking action

---

**🎉 Your risk scoring Edge Function is ready!** It will automatically assess facility risks, update statuses, and provide actionable recommendations to help maintain safe and functional sanitation infrastructure across all districts.