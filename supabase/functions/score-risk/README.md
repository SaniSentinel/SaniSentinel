# Score Risk Edge Function

This Edge Function performs comprehensive risk assessment for sanitation facilities by analyzing climate data, facility reports, maintenance history, and location factors to compute a risk score (0-100) and update facility status accordingly.

## Features

- **Comprehensive Risk Analysis**: Combines multiple data sources for accurate risk assessment
- **Automated Status Updates**: Updates facility status based on calculated risk scores
- **Priority Classification**: Categorizes facilities into low, medium, high, and critical priority levels
- **Action Recommendations**: Provides specific action items for each facility
- **Batch Processing**: Efficiently processes all facilities or a filtered subset
- **Real-time Updates**: Updates facility records with new risk scores and status

## Risk Calculation Components

The risk score (0-100) is calculated from five key factors:

### 1. Climate Risk (0-30 points)
- Based on district flood risk score from climate snapshots
- Higher flood risk increases facility vulnerability
- Weighted at 30% of district flood risk score

### 2. Facility Condition Risk (0-40 points)
- **Good**: 0 points
- **Damaged**: 25 points  
- **Dry**: 20 points
- **Blocked**: 30 points
- **Overflow**: 40 points
- **Out of Service**: 40 points

### 3. Maintenance Overdue Risk (0-30 points)
Based on facility type and days since last service:
- **Toilets**: Monthly maintenance (30 days)
- **Latrines**: Bi-monthly maintenance (60 days)
- **Septic Tanks**: Quarterly maintenance (90 days)
- **Treatment Plants**: Bi-weekly maintenance (14 days)
- **Waste Collection Points**: Weekly maintenance (7 days)

Risk increases with overdue maintenance:
- On time: 0 points
- 1x overdue: 10 points
- 2x overdue: 20 points
- 3x+ overdue: 30 points

### 4. Recent Reports Risk (0-20 points)
- Analyzes reports from last 30 days
- No reports: 15 points (lack of monitoring)
- High ratio of bad condition reports: up to 20 points
- Good condition reports: 0-5 points

### 5. Location Risk (0-10 points)
- Higher risk for septic tanks and treatment plants in flood-prone areas
- Additional risk during storms and heavy rainfall
- Weather-specific adjustments based on current conditions

## Priority Levels

- **Critical (80-100)**: Immediate action required, facility should be out of service
- **High (60-79)**: Urgent attention needed, high risk of failure
- **Medium (40-59)**: Moderate risk, schedule maintenance soon
- **Low (0-39)**: Normal operations, continue regular monitoring

## Usage

### Manual Invocation

```bash
# Process all facilities
curl -X POST 'https://your-project.supabase.co/functions/v1/score-risk' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# Process specific facilities
curl -X POST 'https://your-project.supabase.co/functions/v1/score-risk' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"facility_ids": ["uuid1", "uuid2", "uuid3"]}'
```

### Scheduled Execution

```sql
-- Run risk assessment every 6 hours
SELECT cron.schedule(
  'risk-assessment-6h', 
  '0 */6 * * *', 
  'https://your-project.supabase.co/functions/v1/score-risk'
);

-- Run after climate data updates
SELECT cron.schedule(
  'risk-assessment-after-climate', 
  '30 * * * *', 
  'https://your-project.supabase.co/functions/v1/score-risk'
);
```

### Response Format

**Success Response:**
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
  },
  "timestamp": "2024-02-16T10:30:00Z"
}
```

**Assessment Object:**
```json
{
  "facility_id": "uuid",
  "facility_name": "Tamale Central Market Toilet",
  "current_risk_score": 25,
  "new_risk_score": 45,
  "risk_factors": {
    "climate_risk": 15,
    "facility_condition": 0,
    "maintenance_overdue": 20,
    "recent_reports": 5,
    "location_risk": 5
  },
  "recommended_status": "damaged",
  "priority_level": "medium",
  "action_required": [
    "Schedule immediate maintenance inspection",
    "Continue regular monitoring and maintenance schedule"
  ]
}
```

## Integration Points

### Database Tables Used
- **facilities**: Source data and target for updates
- **climate_snapshots**: Climate risk data via `get_latest_climate_data()`
- **reports**: Recent facility condition reports
- **districts**: Location data for climate correlation

### Automatic Updates
The function automatically updates:
- **risk_score**: New calculated risk score
- **status**: Updated if risk score ≥ 60 and recommended status differs
- **updated_at**: Timestamp of last update

### Triggers Integration
- Works with existing facility update triggers
- Integrates with alert generation systems
- Maintains audit trail through updated_at timestamps

## Action Recommendations

The function generates specific action recommendations:

- **Climate Risk**: "Monitor for flood damage and drainage issues"
- **Maintenance Overdue**: "Schedule immediate maintenance inspection"
- **Poor Condition**: "Repair facility damage and restore functionality"
- **Bad Reports**: "Investigate recurring issues reported by users"
- **Critical Risk**: "URGENT: Take facility out of service until repairs completed"
- **High Risk**: "Prioritize this facility for immediate attention"

## Monitoring and Alerts

### Performance Monitoring
- Track execution time and success rates
- Monitor facility update counts
- Watch for error patterns

### Alert Integration
- High-risk facilities trigger automatic alerts
- Status changes generate notifications
- Critical facilities create urgent alerts

### Dashboard Integration
```sql
-- Get facilities by priority level
SELECT priority_level, COUNT(*) 
FROM (
  SELECT 
    CASE 
      WHEN risk_score >= 80 THEN 'critical'
      WHEN risk_score >= 60 THEN 'high'
      WHEN risk_score >= 40 THEN 'medium'
      ELSE 'low'
    END as priority_level
  FROM facilities
) GROUP BY priority_level;

-- Get facilities needing immediate attention
SELECT name, risk_score, status, last_serviced
FROM facilities 
WHERE risk_score >= 60 
ORDER BY risk_score DESC;
```

## Error Handling

The function handles various scenarios:
- **Missing climate data**: Uses default risk values
- **No reports**: Applies appropriate risk penalty
- **Database errors**: Continues processing other facilities
- **Invalid facility data**: Skips problematic records

## Development and Testing

### Local Testing
```bash
# Start Supabase locally
supabase start

# Serve the function
supabase functions serve score-risk

# Test with sample data
curl -X POST 'http://localhost:54321/functions/v1/score-risk' \
  -H 'Authorization: Bearer YOUR_LOCAL_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Test Scenarios
1. **All facilities**: Process complete facility database
2. **Specific facilities**: Test with facility ID array
3. **High-risk conditions**: Test during flood conditions
4. **No climate data**: Test resilience without climate snapshots
5. **No reports**: Test with facilities lacking recent reports

## Best Practices

1. **Run after climate updates**: Schedule 30 minutes after climate data fetch
2. **Monitor execution time**: Large facility databases may need optimization
3. **Review risk thresholds**: Adjust risk calculation weights based on local conditions
4. **Validate updates**: Check facility status changes make sense
5. **Alert integration**: Ensure high-risk facilities trigger appropriate alerts

## Customization

### Risk Weight Adjustments
Modify the risk calculation weights in the function:
```typescript
// Adjust climate risk weight (currently 30%)
const climateRisk = climateSnapshot ? Math.min(climateSnapshot.flood_risk_score * 0.4, 40) : 20

// Modify maintenance intervals
const maintenanceIntervals = {
  toilet: 21,           // 3 weeks instead of monthly
  treatment_plant: 7,   // Weekly instead of bi-weekly
}
```

### Status Thresholds
Adjust when status changes occur:
```typescript
// More aggressive status updates
const statusNeedsUpdate = recommendedStatus !== facility.status && totalRiskScore >= 50
```

### Custom Actions
Add facility-type specific recommendations:
```typescript
if (facility.type === 'treatment_plant' && risk_factors.climate_risk > 20) {
  actions.push('Check flood protection systems and backup power')
}
```