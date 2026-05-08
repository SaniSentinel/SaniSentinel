# MapView Component - Feature Documentation

## 🗺️ Overview

The MapView component is a comprehensive GIS dashboard for the SaniSentinel system, providing real-time visualization of sanitation facilities across Northern Ghana. It's built with React-Leaflet and centered on Tamale (9.4°N, 0.84°W).

## ✨ Key Features

### 🎯 **Interactive Map**
- **Centered on Tamale, Northern Ghana** (9.4034°N, -0.8424°W)
- **OpenStreetMap tiles** for detailed geographic context
- **Zoom levels**: 6 (regional) to 18 (street level)
- **Custom facility markers** with risk-based color coding
- **Click-to-focus** functionality for detailed facility information

### 🏷️ **Smart Facility Markers**
- **Risk-based color coding**:
  - 🔴 **Red**: Critical risk (85-100)
  - 🟠 **Orange**: High risk (60-84)
  - 🟡 **Yellow**: At risk (30-59)
  - 🟢 **Green**: Good condition (0-29)

- **Status-based icons**:
  - 🚽 Good condition
  - 🌊 Overflow detected
  - 🚫 Blocked facility
  - ⚠️ Damaged infrastructure
  - 🏜️ Dry/empty facility
  - ❌ Out of service

### 🔍 **Advanced Filtering System**
- **Risk Level Filter**: Critical, High Risk, At Risk, Good
- **Status Filter**: Good, Damaged, Overflow, Dry, Blocked, Out of Service
- **Facility Type Filter**: Toilet, Latrine, Septic Tank, Treatment Plant, Waste Collection Point
- **District Filter**: All 18+ Northern Ghana districts
- **Reset functionality** to clear all filters and return to default view

### 📊 **Real-time Statistics Dashboard**
- **Live facility counts** by risk level
- **Quick stats header** showing critical/high/at-risk/good facilities
- **Dynamic updates** via Supabase Realtime subscriptions
- **Filtered results counter** showing "X of Y facilities"

### 🏘️ **District Quick Access**
- **Sidebar district list** with facility counts
- **One-click district focus** (zooms to district center)
- **Automatic filtering** when district is selected
- **Facility count per district** for quick assessment

### 💬 **Interactive Facility Popups**
- **Comprehensive facility information**:
  - Facility name and type icon
  - Current status with color-coded badge
  - Risk score with level indicator
  - District location
  - Last serviced date
  - GPS coordinates
  - Creation timestamp

- **Action buttons**:
  - "Center on Map" - Zooms to facility location
  - "View Details" - Opens detailed modal

### 🔄 **Real-time Data Updates**
- **Supabase Realtime subscriptions** for live updates
- **Automatic marker updates** when facility status changes
- **New report integration** - Updates when SMS reports received
- **Manual refresh button** for on-demand data reload
- **Background data synchronization**

### 📱 **Responsive Design**
- **Desktop-optimized layout** with sidebar and full-screen map
- **Mobile-friendly popups** and controls
- **Touch-friendly markers** and buttons
- **Responsive sidebar** that adapts to screen size

### 🎨 **User Experience Features**
- **Loading states** with spinner and progress indicators
- **Error handling** with retry functionality
- **Smooth animations** for map transitions
- **Intuitive navigation** with breadcrumbs and clear labels
- **Accessibility features** with proper ARIA labels

## 🛠️ **Technical Implementation**

### **Core Technologies**
- **React 18** with functional components and hooks
- **React-Leaflet 4.2.1** for map rendering
- **Leaflet 1.9.4** for core mapping functionality
- **Tailwind CSS** for responsive styling
- **Supabase Realtime** for live data updates

### **Custom Hooks**
- `useFacilities()` - Manages facility data with filtering and real-time updates
- `useSupabase()` - Handles database connections and authentication
- `useLocalStorage()` - Persists user preferences and filter states

### **Data Flow**
```
Supabase Database → useFacilities Hook → MapView Component → Leaflet Map
                 ↗ Realtime Updates ↗
```

### **Performance Optimizations**
- **Efficient marker rendering** with custom div icons
- **Filtered data processing** to reduce DOM updates
- **Memoized callbacks** to prevent unnecessary re-renders
- **Lazy loading** of facility details
- **Optimized Supabase queries** with selective field loading

## 📍 **Geographic Coverage**

### **Primary Focus Area**
- **Northern Ghana Region**
- **18+ Districts** including:
  - Tamale (regional capital)
  - Yendi, Damongo, Bimbilla
  - Salaga, Kpandai, and more

### **Coordinate System**
- **Projection**: WGS84 (EPSG:4326)
- **Center Point**: Tamale (9.4034°N, -0.8424°W)
- **Coverage Area**: ~50km radius from Tamale
- **Precision**: 6 decimal places for GPS coordinates

## 🔗 **Integration Points**

### **Backend Integration**
- **Facilities API** (`src/lib/facilities.js`)
- **Districts API** (`src/lib/districts.js`)
- **Real-time subscriptions** for live updates
- **SMS report integration** via database triggers

### **Component Integration**
- **Header navigation** with active route highlighting
- **Layout system** with responsive design
- **Shared UI components** (buttons, badges, modals)
- **Routing integration** with React Router

## 🚀 **Usage Examples**

### **Basic Navigation**
1. Visit `/map` route to access MapView
2. Use district quick access to focus on specific areas
3. Apply filters to narrow down facility types
4. Click markers for detailed facility information

### **Monitoring Workflows**
1. **Daily Check**: Review critical/high-risk facilities (red/orange markers)
2. **District Focus**: Select district from sidebar for localized view
3. **Status Monitoring**: Filter by status to identify specific issues
4. **Maintenance Planning**: Use "Last Serviced" data for scheduling

### **Emergency Response**
1. **Critical Alert Response**: Filter for critical risk facilities
2. **Overflow Management**: Filter by overflow status for immediate action
3. **Geographic Coordination**: Use coordinates for field team dispatch
4. **Real-time Updates**: Monitor live status changes during interventions

## 🔧 **Configuration Options**

### **Map Settings** (in `src/lib/constants.js`)
```javascript
export const MAP_CONFIG = {
  defaultCenter: [9.4034, -0.8424], // Tamale coordinates
  defaultZoom: 9,
  maxZoom: 18,
  minZoom: 6,
}
```

### **Risk Level Thresholds**
```javascript
export const RISK_LEVELS = {
  GOOD: { min: 0, max: 29, color: '#10B981' },
  AT_RISK: { min: 30, max: 59, color: '#EAB308' },
  HIGH_RISK: { min: 60, max: 84, color: '#F59E0B' },
  CRITICAL: { min: 85, max: 100, color: '#DC2626' }
}
```

## 🎯 **Future Enhancements**

### **Planned Features**
- **Heatmap visualization** for risk density
- **Clustering** for high-density areas
- **Route optimization** for maintenance teams
- **Offline map caching** for field use
- **Custom map layers** (satellite, terrain)
- **Facility photos** in popups
- **Historical data visualization** with time slider
- **Export functionality** (PDF maps, facility lists)

### **Advanced Analytics**
- **Risk trend analysis** over time
- **Maintenance efficiency metrics**
- **Climate correlation visualization**
- **Predictive maintenance indicators**

## 📚 **Related Documentation**
- [Project README](./README.md) - Overall project documentation
- [Climate Automation](./CLIMATE_AUTOMATION_SUMMARY.md) - Backend automation system
- [SMS Integration](./SMS_SETUP_GUIDE.md) - Field worker communication
- [Database Schema](./database/RLS_SECURITY_GUIDE.md) - Data structure and security

---

**Built with ❤️ for Northern Ghana's sanitation infrastructure monitoring**