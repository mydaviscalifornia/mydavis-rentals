import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";

// ============================================================
// WALK SCORE REFERENCE POINTS
// ============================================================
// 420 Hutchison Dr, Davis, CA 95616 = UC Davis Memorial Union (campus center)
// 730 3rd St, Davis, CA 95616 = Downtown Davis core
const REFERENCE_POINTS = [
  { id: "ucd", label: "UC Davis", shortLabel: "UCD", address: "420 Hutchison Dr", lat: 38.5421, lng: -121.7494, emoji: "\uD83C\uDF93" },
  { id: "downtown", label: "Downtown Davis", shortLabel: "DT", address: "730 3rd St", lat: 38.5449, lng: -121.7405, emoji: "\uD83C\uDFD9\uFE0F" },
];

// Haversine distance in miles
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Walk score: 100 = on-site, 0 = 5+ miles. Bike-friendly Davis means 2mi is still very accessible.
function walkScore(aptLat, aptLng, refLat, refLng) {
  const d = distanceMiles(aptLat, aptLng, refLat, refLng);
  if (d <= 0.15) return 100;
  if (d >= 5) return 0;
  return Math.round(Math.max(0, 100 - (d / 5) * 100));
}

function walkLabel(score) {
  if (score >= 90) return "On Doorstep";
  if (score >= 70) return "Easy Walk";
  if (score >= 50) return "Bikeable";
  if (score >= 30) return "Short Drive";
  return "Drive Required";
}

function walkColor(score) {
  if (score >= 80) return "#00c853";
  if (score >= 60) return "#76ff03";
  if (score >= 40) return "#ffd600";
  if (score >= 20) return "#ff9100";
  return "#ff3d00";
}

// ============================================================
// APARTMENT DATA
// ============================================================
const APARTMENTS = [
  // === DOWNTOWN ===
  { name: "Academy Lane Apartments", address: "1124 F St", lat: 38.5456, lng: -121.7399, area: "Downtown", type: "General", beds: "1-2", rentLow: 1800, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 24, built: 2000, mgmt: "Academy Lane" },
  { name: "St. George Apartments", address: "811 F St", lat: 38.5443, lng: -121.7399, area: "Downtown", type: "General", beds: "2", rentLow: 2200, rentHigh: 2500, amenities: ["W/D In-Unit", "Parking", "Renovated"], pet: false, units: 17, built: 1970, mgmt: "Private" },
  { name: "University Square Apartments", address: "300 J St", lat: 38.5434, lng: -121.7439, area: "Downtown", type: "General", beds: "S-2", rentLow: 1500, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 107, built: 1970, mgmt: "Davisville" },
  { name: "Kensington Apartments", address: "615 7th St", lat: 38.5449, lng: -121.7422, area: "Downtown", type: "General", beds: "1-2", rentLow: 1600, rentHigh: 2200, amenities: ["Laundry", "Parking"], pet: false, units: 20, built: 1965, mgmt: "Private" },
  { name: "Viking Apartments", address: "801 D St", lat: 38.5443, lng: -121.7475, area: "Downtown", type: "General", beds: "1-2", rentLow: 1500, rentHigh: 2100, amenities: ["Laundry", "Parking"], pet: false, units: 35, built: 1965, mgmt: "Private" },
  { name: "Woodside Apartments", address: "808 F St", lat: 38.5443, lng: -121.7401, area: "Downtown", type: "General", beds: "1-2", rentLow: 1600, rentHigh: 2300, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 20, built: 1968, mgmt: "Private" },
  { name: "The Lofts", address: "109 E St", lat: 38.5430, lng: -121.7454, area: "Downtown", type: "General", beds: "1-2", rentLow: 1800, rentHigh: 2600, amenities: ["W/D In-Unit", "Modern"], pet: true, units: 12, built: 2005, mgmt: "Private" },
  { name: "Stratford Place", address: "745 F St", lat: 38.5441, lng: -121.7399, area: "Downtown", type: "General", beds: "1-2", rentLow: 1700, rentHigh: 2300, amenities: ["Laundry", "Parking"], pet: false, units: 18, built: 1972, mgmt: "Private" },
  { name: "Orange Tree Apartments", address: "311 7th St", lat: 38.5449, lng: -121.7454, area: "Downtown", type: "General", beds: "S-1", rentLow: 1400, rentHigh: 1900, amenities: ["Laundry"], pet: false, units: 16, built: 1963, mgmt: "Private" },
  { name: "Redwood Tree Apartments", address: "607 E 8th St", lat: 38.5455, lng: -121.7421, area: "Downtown", type: "General", beds: "1-2", rentLow: 1800, rentHigh: 2200, amenities: ["Laundry", "Study Room", "Parking"], pet: false, units: 30, built: 1970, mgmt: "Private" },
  { name: "Cesar Chavez Plaza", address: "1720 Olive Dr", lat: 38.5413, lng: -121.7373, area: "Downtown", type: "Affordable", beds: "1-3", rentLow: 900, rentHigh: 1600, amenities: ["Laundry", "Parking", "Playground"], pet: true, units: 60, built: 1995, mgmt: "CHOC" },
  { name: "Rosa Parks Townhouses", address: "1205 5th St", lat: 38.5453, lng: -121.7353, area: "Downtown", type: "Affordable", beds: "2-3", rentLow: 1000, rentHigh: 1500, amenities: ["Laundry", "Parking"], pet: false, units: 12, built: 1998, mgmt: "CHOC" },
  { name: "Kings & Queens Apartments", address: "801 E 8th St", lat: 38.5455, lng: -121.7406, area: "Downtown", type: "General", beds: "1-2", rentLow: 1600, rentHigh: 2100, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 40, built: 1968, mgmt: "Private" },

  // === CENTRAL DAVIS ===
  { name: "Parkside Apartments", address: "1420 F St", lat: 38.5470, lng: -121.7399, area: "Central", type: "General", beds: "S-4", rentLow: 1675, rentHigh: 4292, amenities: ["Pool", "Laundry", "Parking", "Fitness"], pet: true, units: 200, built: 1972, mgmt: "Parkside" },
  { name: "Anderson Place Apartments", address: "1850 Hanover Dr", lat: 38.5498, lng: -121.7447, area: "Central", type: "General", beds: "1-3", rentLow: 1800, rentHigh: 2800, amenities: ["Pool", "Fitness", "Laundry", "Parking", "Clubhouse"], pet: true, units: 240, built: 1985, mgmt: "Tandem" },
  { name: "University Court Apartments", address: "515 Sycamore Ln", lat: 38.5481, lng: -121.7443, area: "Central", type: "General", beds: "S-2", rentLow: 1700, rentHigh: 2700, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 161, built: 1972, mgmt: "Private" },
  { name: "Sycamore Lane Apartments", address: "614 Sycamore Ln", lat: 38.5485, lng: -121.7443, area: "Central", type: "General", beds: "1-2", rentLow: 1700, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking", "Garden"], pet: true, units: 100, built: 1970, mgmt: "Private" },
  { name: "University Commons Apartments", address: "707 Sycamore Ln", lat: 38.5490, lng: -121.7443, area: "Central", type: "General", beds: "1-2", rentLow: 1800, rentHigh: 2500, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 48, built: 1975, mgmt: "Private" },
  { name: "Oxford Parkside Apartments", address: "1424 Wake Forest Dr", lat: 38.5478, lng: -121.7479, area: "Central", type: "General", beds: "1-2", rentLow: 1700, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 63, built: 1975, mgmt: "Private" },
  { name: "The Drake", address: "919 Drake Dr", lat: 38.5494, lng: -121.7472, area: "Central", type: "General", beds: "1-2", rentLow: 1800, rentHigh: 2600, amenities: ["Pool", "Laundry", "Parking", "Balcony"], pet: true, units: 93, built: 1980, mgmt: "Tandem" },
  { name: "Cranbrook Apartments", address: "955 Cranbrook Ct", lat: 38.5500, lng: -121.7465, area: "Central", type: "General", beds: "1-2", rentLow: 1850, rentHigh: 2500, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 50, built: 1980, mgmt: "Tandem" },
  { name: "Wake Forest Apartments", address: "1313 Wake Forest Dr", lat: 38.5476, lng: -121.7479, area: "Central", type: "General", beds: "1-2", rentLow: 1600, rentHigh: 2300, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 68, built: 1973, mgmt: "Private" },
  { name: "Hanover Place Apartments", address: "1740 Hanover Dr", lat: 38.5492, lng: -121.7447, area: "Central", type: "General", beds: "1-2", rentLow: 1700, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 40, built: 1978, mgmt: "Private" },
  { name: "La Casa de Flores", address: "517 Oxford Cir", lat: 38.5475, lng: -121.7485, area: "Central", type: "General", beds: "1-2", rentLow: 1600, rentHigh: 2200, amenities: ["Laundry", "Parking"], pet: false, units: 45, built: 1968, mgmt: "Private" },
  { name: "Identity Davis", address: "525 Oxford Cir", lat: 38.5476, lng: -121.7488, area: "Central", type: "Student", beds: "3-5", rentLow: 1019, rentHigh: 1499, amenities: ["Pool", "Fitness", "W/D In-Unit", "Study Lounge", "Furnished", "Shuttle"], pet: true, units: 150, built: 2017, mgmt: "Identity" },
  { name: "Greenbriar Apartments", address: "581 9th St", lat: 38.5458, lng: -121.7442, area: "Central", type: "General", beds: "1", rentLow: 1500, rentHigh: 1900, amenities: ["Laundry", "Parking"], pet: false, units: 40, built: 1960, mgmt: "Private" },
  { name: "Sterling Pointe Apartments", address: "1805 Anderson Rd", lat: 38.5499, lng: -121.7452, area: "Central", type: "General", beds: "1-2", rentLow: 1800, rentHigh: 2500, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 57, built: 1985, mgmt: "Private" },
  { name: "Tamarack Apartments", address: "804 9th St", lat: 38.5458, lng: -121.7430, area: "Central", type: "General", beds: "1-2", rentLow: 1500, rentHigh: 2000, amenities: ["Laundry", "Parking"], pet: false, units: 20, built: 1965, mgmt: "Private" },

  // === NORTH DAVIS ===
  { name: "Aggie Square Apartments", address: "644 Alvarado Ave", lat: 38.5575, lng: -121.7485, area: "North", type: "General", beds: "2-3", rentLow: 1900, rentHigh: 2800, amenities: ["Pool", "Fitness", "Laundry", "WiFi", "BBQ"], pet: true, units: 100, built: 1990, mgmt: "Davisville" },
  { name: "Almondwood Apartments", address: "1212 Alvarado Ave", lat: 38.5600, lng: -121.7485, area: "North", type: "General", beds: "2-3", rentLow: 2000, rentHigh: 2900, amenities: ["Pool", "Spa", "Fitness", "Laundry", "BBQ", "WiFi"], pet: true, units: 100, built: 1990, mgmt: "Davisville" },
  { name: "Fountain Circle Townhomes", address: "1213 Alvarado Ave", lat: 38.5602, lng: -121.7488, area: "North", type: "General", beds: "2-3", rentLow: 2100, rentHigh: 3000, amenities: ["Pool", "Fitness", "Laundry", "WiFi", "Townhouse"], pet: true, units: 105, built: 1990, mgmt: "Davisville" },
  { name: "Chautauqua Apartments", address: "717 Alvarado Ave", lat: 38.5579, lng: -121.7485, area: "North", type: "General", beds: "S-2", rentLow: 1400, rentHigh: 2300, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 138, built: 1975, mgmt: "Tandem" },
  { name: "Chaparral Apartments", address: "2689 Sycamore Ln", lat: 38.5560, lng: -121.7443, area: "North", type: "General", beds: "S-2", rentLow: 1500, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 60, built: 1975, mgmt: "Tandem" },
  { name: "Casitas Del Valle", address: "675 Alvarado Ave", lat: 38.5576, lng: -121.7485, area: "North", type: "General", beds: "S-2", rentLow: 960, rentHigh: 2200, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 89, built: 1975, mgmt: "Tandem" },
  { name: "La Salle Apartments", address: "880 Alvarado Ave", lat: 38.5585, lng: -121.7485, area: "North", type: "General", beds: "1-3", rentLow: 1700, rentHigh: 2800, amenities: ["Pool", "Laundry", "Parking", "Balcony"], pet: true, units: 98, built: 1980, mgmt: "Private" },
  { name: "Sequoia Apartments", address: "2255 Sycamore Ln", lat: 38.5540, lng: -121.7443, area: "North", type: "General", beds: "1-2", rentLow: 1600, rentHigh: 2300, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 52, built: 1975, mgmt: "Private" },
  { name: "Pepperwood Apartments", address: "2222 Sycamore Ln", lat: 38.5538, lng: -121.7443, area: "North", type: "General", beds: "2-3", rentLow: 2000, rentHigh: 2800, amenities: ["Pool", "Laundry", "Parking", "Patio"], pet: true, units: 41, built: 1980, mgmt: "Private" },
  { name: "Parque Plaza Apartments", address: "690 Alvarado Ave", lat: 38.5577, lng: -121.7485, area: "North", type: "General", beds: "1-2", rentLow: 1500, rentHigh: 2200, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 30, built: 1975, mgmt: "Private" },
  { name: "Alvarado Sunset Apartments", address: "606 Alvarado Ave", lat: 38.5573, lng: -121.7485, area: "North", type: "General", beds: "1-2", rentLow: 1500, rentHigh: 2200, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 65, built: 1975, mgmt: "Private" },

  // === SOUTH DAVIS ===
  { name: "Renaissance Park Apartments", address: "3000 Lillard Dr", lat: 38.5335, lng: -121.7370, area: "South", type: "General", beds: "1-3", rentLow: 1867, rentHigh: 3000, amenities: ["Pool", "Fitness", "W/D In-Unit", "Parking", "Dog Park", "EV Charging"], pet: true, units: 200, built: 2005, mgmt: "Renaissance" },
  { name: "The Edge Apartments", address: "4255 Cowell Blvd", lat: 38.5310, lng: -121.7430, area: "South", type: "General", beds: "1-3", rentLow: 1800, rentHigh: 2900, amenities: ["Pool", "Fitness", "Laundry", "Parking", "Clubhouse"], pet: true, units: 150, built: 2000, mgmt: "Edge" },
  { name: "El Macero Village Apartments", address: "44684 El Macero Dr", lat: 38.5320, lng: -121.7300, area: "South", type: "General", beds: "1-2", rentLow: 1700, rentHigh: 2500, amenities: ["Pool", "Laundry", "Parking", "Renovated"], pet: true, units: 80, built: 1975, mgmt: "Private" },
  { name: "Pinecrest Apartments", address: "2525 E 8th St", lat: 38.5455, lng: -121.7280, area: "South", type: "General", beds: "1-2", rentLow: 1700, rentHigh: 2400, amenities: ["Pool", "Fitness", "Laundry", "Parking"], pet: true, units: 60, built: 1980, mgmt: "Pinecrest" },

  // === EAST DAVIS (MACE RANCH) ===
  { name: "Alhambra at Mace Ranch", address: "2753 Alhambra Dr", lat: 38.5460, lng: -121.7180, area: "East", type: "General", beds: "1-3", rentLow: 2000, rentHigh: 3100, amenities: ["Pool", "Fitness", "W/D In-Unit", "Parking", "Playground", "EV Charging"], pet: true, units: 180, built: 2010, mgmt: "Alhambra" },
  { name: "Seville at Mace Ranch", address: "1265 Valdora St", lat: 38.5440, lng: -121.7200, area: "East", type: "General", beds: "1-2", rentLow: 1900, rentHigh: 2700, amenities: ["Pool", "Fitness", "Laundry", "Parking", "Clubhouse"], pet: true, units: 120, built: 2000, mgmt: "Seville" },
  { name: "Ellington Apartments", address: "4211 Cowell Blvd", lat: 38.5305, lng: -121.7160, area: "East", type: "General", beds: "1-4", rentLow: 2100, rentHigh: 3500, amenities: ["Pool", "Fitness", "W/D In-Unit", "Dog Park", "EV Charging", "Clubhouse"], pet: true, units: 200, built: 2018, mgmt: "Ellington" },

  // === WEST DAVIS ===
  { name: "The Trees Apartments", address: "1111 Arroyo Ave", lat: 38.5490, lng: -121.7680, area: "West", type: "General", beds: "1-3", rentLow: 1900, rentHigh: 2900, amenities: ["Pool", "Spa", "Fitness", "Laundry", "Parking"], pet: true, units: 100, built: 1985, mgmt: "Trees" },
  { name: "Arlington Farm", address: "2901 Portage Bay W", lat: 38.5460, lng: -121.7640, area: "West", type: "General", beds: "1-3", rentLow: 2100, rentHigh: 3200, amenities: ["W/D In-Unit", "Garage", "Patio", "Modern"], pet: true, units: 80, built: 2008, mgmt: "Tandem" },
  { name: "Aspen Village Apartments", address: "1900 Cowell Blvd", lat: 38.5340, lng: -121.7580, area: "West", type: "General", beds: "1-2", rentLow: 1700, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 70, built: 1985, mgmt: "Private" },
  { name: "Sundance Apartments", address: "510 Arthur St", lat: 38.5464, lng: -121.7550, area: "West", type: "General", beds: "1-2", rentLow: 1800, rentHigh: 2600, amenities: ["Pool", "Fitness", "Laundry", "Parking"], pet: true, units: 80, built: 1980, mgmt: "Tandem" },
  { name: "Adobe at Evergreen", address: "1500 Shasta Dr", lat: 38.5510, lng: -121.7590, area: "West", type: "General", beds: "S-1", rentLow: 1400, rentHigh: 1900, amenities: ["Pool", "Laundry", "Parking"], pet: false, units: 64, built: 1980, mgmt: "Tandem" },
  { name: "The Willows Apartments", address: "1959 Lake Blvd", lat: 38.5480, lng: -121.7620, area: "West", type: "General", beds: "1-2", rentLow: 1600, rentHigh: 2400, amenities: ["Pool", "Laundry", "Parking"], pet: true, units: 100, built: 1975, mgmt: "Tandem" },

  // === NEWER / LUXURY ===
  { name: "Greenhaus", address: "1720 Research Park Dr", lat: 38.5370, lng: -121.7460, area: "South", type: "General", beds: "S-2", rentLow: 2200, rentHigh: 3200, amenities: ["Pool", "Fitness", "W/D In-Unit", "Bike Storage", "Lounge", "EV Charging", "Modern"], pet: true, units: 160, built: 2024, mgmt: "Greenhaus" },
  { name: "Octave Apartments", address: "1101 Olive Dr", lat: 38.5410, lng: -121.7380, area: "South", type: "General", beds: "1-3", rentLow: 2300, rentHigh: 3500, amenities: ["Pool", "Fitness", "W/D In-Unit", "Rooftop", "Modern", "EV Charging"], pet: true, units: 120, built: 2022, mgmt: "Octave" },
  { name: "The Celeste", address: "780 Pole Line Rd", lat: 38.5450, lng: -121.7250, area: "East", type: "General", beds: "1-3", rentLow: 2200, rentHigh: 3400, amenities: ["W/D In-Unit", "Fitness", "Dog Park", "Modern", "EV Charging"], pet: true, units: 100, built: 2023, mgmt: "Celeste" },
  { name: "Tanglewood", address: "2033 F St", lat: 38.5510, lng: -121.7399, area: "Central", type: "General", beds: "1-3", rentLow: 2000, rentHigh: 3200, amenities: ["Pool", "Fitness", "W/D In-Unit", "Study Room", "BBQ", "Modern"], pet: true, units: 150, built: 2020, mgmt: "Tanglewood" },

  // === STUDENT-ONLY ===
  { name: "The Colleges at La Rue", address: "164 La Rue Rd", lat: 38.5400, lng: -121.7550, area: "Campus", type: "Student", beds: "2-4", rentLow: 900, rentHigh: 1600, amenities: ["Furnished", "Shuttle", "Study Lounge", "Fitness", "Pool"], pet: false, units: 300, built: 2015, mgmt: "UC Davis" },
  { name: "Primero Grove", address: "500 Primero Grove", lat: 38.5430, lng: -121.7560, area: "Campus", type: "Student", beds: "2-4", rentLow: 1000, rentHigh: 1700, amenities: ["Furnished", "Study Lounge", "Laundry"], pet: false, units: 200, built: 2012, mgmt: "UC Davis" },
  { name: "The Ramble", address: "West Village", lat: 38.5380, lng: -121.7660, area: "Campus", type: "Student", beds: "2-4", rentLow: 1100, rentHigh: 1800, amenities: ["Furnished", "Pool", "Fitness", "Study Lounge", "Shuttle"], pet: false, units: 250, built: 2020, mgmt: "UC Davis" },
  { name: "Solano Park", address: "4400 Solano Park Cir", lat: 38.5365, lng: -121.7545, area: "Campus", type: "Student", beds: "1-2", rentLow: 800, rentHigh: 1300, amenities: ["Laundry", "Parking", "Playground"], pet: true, units: 260, built: 1965, mgmt: "UC Davis" },
  { name: "Orchard Park", address: "5000 Orchard Park Cir", lat: 38.5350, lng: -121.7560, area: "Campus", type: "Student", beds: "1-3", rentLow: 900, rentHigh: 1500, amenities: ["Laundry", "Parking", "Playground", "Community Garden"], pet: true, units: 200, built: 1965, mgmt: "UC Davis" },
  { name: "Axis at Davis", address: "215 2nd St", lat: 38.5434, lng: -121.7460, area: "Downtown", type: "Student", beds: "1-4", rentLow: 1100, rentHigh: 1800, amenities: ["Pool", "Fitness", "Furnished", "Study Lounge", "W/D In-Unit"], pet: true, units: 175, built: 2014, mgmt: "Axis" },
  { name: "The Grove at Davis", address: "3080 5th St", lat: 38.5453, lng: -121.7270, area: "East", type: "Student", beds: "2-5", rentLow: 1050, rentHigh: 1650, amenities: ["Pool", "Fitness", "Furnished", "Shuttle", "W/D In-Unit", "Study Lounge"], pet: true, units: 200, built: 2017, mgmt: "Grove" },

  // === SENIOR HOUSING ===
  { name: "Shasta Point Retirement", address: "1515 Shasta Dr", lat: 38.5520, lng: -121.7590, area: "West", type: "Senior", beds: "S-1", rentLow: 900, rentHigh: 1400, amenities: ["Elevator", "Community Room", "Garden", "Laundry"], pet: false, units: 60, built: 1990, mgmt: "PRS Living" },
  { name: "Cornerstone Senior Apartments", address: "3101 5th St", lat: 38.5453, lng: -121.7260, area: "East", type: "Senior", beds: "1-2", rentLow: 1100, rentHigh: 1700, amenities: ["Pool", "Fitness", "Elevator", "Community Room", "Laundry"], pet: false, units: 80, built: 2005, mgmt: "Cornerstone" },
  { name: "Eleanor Roosevelt Circle", address: "675 Cantrill Dr", lat: 38.5560, lng: -121.7260, area: "East", type: "Senior", beds: "1-2", rentLow: 1200, rentHigh: 1800, amenities: ["Community Room", "Garden", "Laundry"], pet: false, units: 50, built: 1995, mgmt: "Private" },
  { name: "Owendale Community", address: "310 Becerra Way", lat: 38.5340, lng: -121.7480, area: "South", type: "Senior", beds: "1-2", rentLow: 1000, rentHigh: 1600, amenities: ["Community Room", "Garden", "Laundry", "Parking"], pet: true, units: 40, built: 2000, mgmt: "Private" },

  // === AFFORDABLE HOUSING ===
  { name: "Sojourner Truth Garden", address: "1220 5th St", lat: 38.5453, lng: -121.7353, area: "Downtown", type: "Affordable", beds: "1-3", rentLow: 800, rentHigh: 1400, amenities: ["Laundry", "Parking", "Garden"], pet: false, units: 14, built: 1998, mgmt: "CHOC" },
  { name: "Pacifico Cooperative Housing", address: "2nd & Cantrill", lat: 38.5555, lng: -121.7260, area: "East", type: "Affordable", beds: "2-3", rentLow: 700, rentHigh: 1200, amenities: ["Laundry", "Community Room", "Garden"], pet: false, units: 60, built: 2005, mgmt: "Cooperative" },
].map(apt => {
  const scores = REFERENCE_POINTS.map(ref => ({
    id: ref.id,
    score: walkScore(apt.lat, apt.lng, ref.lat, ref.lng),
    distance: distanceMiles(apt.lat, apt.lng, ref.lat, ref.lng),
  }));
  const avgScore = Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length);
  return { ...apt, scores, avgScore, amenityCount: apt.amenities.length };
});

// ============================================================
// THEMES
// ============================================================
const THEMES = {
  dark: {
    bg: "#0a0a0f", bgCard: "#111118", bgInput: "rgba(255,255,255,0.03)", bgHover: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.06)", borderLight: "rgba(255,255,255,0.04)", borderInput: "rgba(255,255,255,0.1)",
    text: "#e8e8ed", textStrong: "#fff", textMuted: "#777", textDim: "#666", textFaint: "#555", textGhost: "#444",
    accent: "#6366f1", accentLight: "#a5b4fc", accentBg: "rgba(99,102,241,0.15)",
    headerBg: "rgba(10,10,15,0.95)", badgeBg: "rgba(255,215,0,0.08)", badgeBorder: "rgba(255,215,0,0.2)", badgeText: "#d4a017",
    scrollThumb: "rgba(255,255,255,0.1)", chipBorder: "rgba(255,255,255,0.08)", chipHover: "rgba(255,255,255,0.2)",
    modalBg: "rgba(0,0,0,0.7)", modalCard: "#111118", overlayBg: "rgba(0,0,0,0.8)",
    rangeBg: "rgba(255,255,255,0.1)", rowHover: "rgba(255,255,255,0.03)",
    scorePillBg: (c) => `${c}18`,
    footerText: "#444",
  },
  light: {
    bg: "#f5f5f0", bgCard: "#ffffff", bgInput: "rgba(0,0,0,0.04)", bgHover: "rgba(0,0,0,0.03)",
    border: "rgba(0,0,0,0.08)", borderLight: "rgba(0,0,0,0.05)", borderInput: "rgba(0,0,0,0.12)",
    text: "#1a1a2e", textStrong: "#000", textMuted: "#666", textDim: "#888", textFaint: "#aaa", textGhost: "#ccc",
    accent: "#4f46e5", accentLight: "#6366f1", accentBg: "rgba(79,70,229,0.1)",
    headerBg: "rgba(245,245,240,0.95)", badgeBg: "rgba(180,140,40,0.08)", badgeBorder: "rgba(180,140,40,0.25)", badgeText: "#8a6d1b",
    scrollThumb: "rgba(0,0,0,0.12)", chipBorder: "rgba(0,0,0,0.1)", chipHover: "rgba(0,0,0,0.2)",
    modalBg: "rgba(255,255,255,0.8)", modalCard: "#ffffff", overlayBg: "rgba(255,255,255,0.85)",
    rangeBg: "rgba(0,0,0,0.1)", rowHover: "rgba(0,0,0,0.03)",
    scorePillBg: (c) => `${c}15`,
    footerText: "#999",
  },
};

// ============================================================
// COMPONENT
// ============================================================
export default function DavisRentals() {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [maxRent, setMaxRent] = useState(4500);
  const [sortBy, setSortBy] = useState("avgScore");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedApt, setSelectedApt] = useState(null);
  const [amenityFilter, setAmenityFilter] = useState([]);
  const [petOnly, setPetOnly] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try { const s = window.localStorage?.getItem?.("mdc-theme"); if (s) return s === "dark"; } catch(e) {}
    return true;
  });
  const modalRef = useRef(null);
  const t = isDark ? THEMES.dark : THEMES.light;

  useEffect(() => {
    try { window.localStorage?.setItem?.("mdc-theme", isDark ? "dark" : "light"); } catch(e) {}
  }, [isDark]);

  const allAmenities = useMemo(() => {
    const set = new Set();
    APARTMENTS.forEach(a => a.amenities.forEach(am => set.add(am)));
    return [...set].sort();
  }, []);

  const areas = ["All", "Campus", "Downtown", "Central", "North", "South", "East", "West"];
  const types = ["All", "General", "Student", "Senior", "Affordable"];

  const filtered = useMemo(() => {
    let list = APARTMENTS.filter(a => {
      if (areaFilter !== "All" && a.area !== areaFilter) return false;
      if (typeFilter !== "All" && a.type !== typeFilter) return false;
      if (a.rentLow > maxRent) return false;
      if (petOnly && !a.pet) return false;
      if (amenityFilter.length > 0 && !amenityFilter.every(af => a.amenities.includes(af))) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q) || a.area.toLowerCase().includes(q);
      }
      return true;
    });
    list.sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case "avgScore": va = a.avgScore; vb = b.avgScore; break;
        case "rentLow": va = a.rentLow; vb = b.rentLow; break;
        case "rentHigh": va = a.rentHigh; vb = b.rentHigh; break;
        case "amenityCount": va = a.amenityCount; vb = b.amenityCount; break;
        case "built": va = a.built; vb = b.built; break;
        case "units": va = a.units; vb = b.units; break;
        default: va = a.avgScore; vb = b.avgScore;
      }
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return list;
  }, [search, areaFilter, typeFilter, maxRent, sortBy, sortDir, petOnly, amenityFilter]);

  const toggleCompare = useCallback((apt) => {
    setCompareList(prev => prev.some(a => a.name === apt.name) ? prev.filter(a => a.name !== apt.name) : prev.length < 4 ? [...prev, apt] : prev);
  }, []);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const typeColors = { General: "#6366f1", Student: "#f59e0b", Senior: "#10b981", Affordable: "#ec4899" };
  const areaEmoji = { Campus: "\uD83C\uDF93", Downtown: "\uD83C\uDFD9\uFE0F", Central: "\uD83C\uDFE0", North: "\u2B06\uFE0F", South: "\u2B07\uFE0F", East: "\u27A1\uFE0F", West: "\u2B05\uFE0F" };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans', -apple-system, sans-serif", transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .apt-row { transition: all 0.2s ease; cursor: pointer; }
        .apt-row:hover { background: ${t.rowHover} !important; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid ${t.chipBorder}; cursor: pointer; transition: all 0.15s; user-select: none; }
        .chip:hover { border-color: ${t.chipHover}; }
        .chip.active { background: ${t.accentBg}; border-color: ${t.accent}; color: ${t.accentLight}; }
        .score-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 36px; padding: 2px 8px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; }
        .filter-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: ${t.textDim}; font-weight: 600; margin-bottom: 6px; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: ${t.rangeBg}; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${t.accent}; cursor: pointer; }
        .compare-bar { position: fixed; bottom: 0; left: 0; right: 0; background: ${t.headerBg}; backdrop-filter: blur(20px); border-top: 1px solid ${t.border}; padding: 12px 24px; z-index: 100; animation: fadeIn 0.3s; display: flex; align-items: center; justify-content: space-between; }
      `}</style>

      {/* HEADER — MDC INSIDER + Theme Toggle */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: "14px 24px", background: t.headerBg, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="https://mydaviscalifornia.com" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #7B2D8E, #E84393)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontWeight: 700, fontSize: 10, color: t.textStrong }}>MDC</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>mydaviscalifornia</div>
                <div style={{ fontSize: 9, color: t.textDim, textTransform: "uppercase", letterSpacing: 1.5 }}>Rental Market Guide</div>
              </div>
            </a>
            <div style={{ padding: "4px 14px", borderRadius: 20, background: t.badgeBg, border: `1px solid ${t.badgeBorder}`, fontSize: 10, fontWeight: 700, color: t.badgeText, textTransform: "uppercase", letterSpacing: 1.5 }}>
              MDC Insider
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setIsDark(!isDark)} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} style={{
              width: 38, height: 38, borderRadius: 10, border: `1px solid ${t.border}`,
              background: t.bgInput, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 16, transition: "all 0.3s ease", position: "relative", overflow: "hidden",
            }}>
              <span style={{ transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s", transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)", opacity: isDark ? 1 : 0, position: "absolute" }}>{"\u2600\uFE0F"}</span>
              <span style={{ transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s", transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)", opacity: isDark ? 0 : 1, position: "absolute" }}>{"\uD83C\uDF19"}</span>
            </button>
            <a href="https://mydaviscalifornia.com" style={{ fontSize: 12, color: t.textMuted, textDecoration: "none", padding: "8px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgInput }}>{"\u2190"} Back to MDC</a>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 24px 32px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>Davis, California</div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: t.textStrong, margin: "0 0 8px", lineHeight: 1.1 }}>Every Apartment.<br />One Page.</h1>
        <p style={{ fontSize: 15, color: t.textMuted, maxWidth: 520, lineHeight: 1.6, margin: "0 0 24px" }}>Compare {APARTMENTS.length} apartment communities across Davis. Filter by price, amenities, and proximity to UC Davis or Downtown.</p>

        {/* Reference Point Legend */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          {REFERENCE_POINTS.map(ref => (
            <div key={ref.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: t.bgInput, border: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 18 }}>{ref.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Walk Score: {ref.label}</div>
                <div style={{ fontSize: 10, color: t.textDim }}>{ref.address}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 24px" }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Search */}
          <div style={{ flex: "1 1 220px" }}>
            <div className="filter-label">Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, address, area..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.borderInput}`, background: t.bgInput, color: t.text, fontSize: 13, outline: "none" }} />
          </div>
          {/* Area */}
          <div>
            <div className="filter-label">Area</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {areas.map(a => <span key={a} className={`chip ${areaFilter === a ? "active" : ""}`} onClick={() => setAreaFilter(a)}>{a !== "All" && areaEmoji[a]} {a}</span>)}
            </div>
          </div>
          {/* Type */}
          <div>
            <div className="filter-label">Type</div>
            <div style={{ display: "flex", gap: 4 }}>
              {types.map(t => <span key={t} className={`chip ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)} style={typeFilter === t ? { background: `${typeColors[t] || "#6366f1"}22`, borderColor: typeColors[t] || "#6366f1", color: typeColors[t] || "#a5b4fc" } : {}}>{t}</span>)}
            </div>
          </div>
          {/* Max Rent */}
          <div style={{ minWidth: 160 }}>
            <div className="filter-label">Max Rent: ${maxRent.toLocaleString()}</div>
            <input type="range" min={500} max={4500} step={100} value={maxRent} onChange={e => setMaxRent(+e.target.value)} />
          </div>
          {/* Pet */}
          <div>
            <span className={`chip ${petOnly ? "active" : ""}`} onClick={() => setPetOnly(!petOnly)} style={{ marginTop: 18 }}>{"\uD83D\uDC3E"} Pets OK</span>
          </div>
        </div>

        {/* Amenity filters */}
        <div style={{ marginTop: 12 }}>
          <div className="filter-label">Amenities</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {allAmenities.map(am => <span key={am} className={`chip ${amenityFilter.includes(am) ? "active" : ""}`} onClick={() => setAmenityFilter(prev => prev.includes(am) ? prev.filter(a => a !== am) : [...prev, am])}>{am}</span>)}
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: t.textFaint }}>{filtered.length} of {APARTMENTS.length} apartments shown</div>
      </div>

      {/* TABLE */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 120px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              <th style={{ padding: "10px 8px", textAlign: "left", color: t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, width: 30 }}></th>
              <th style={{ padding: "10px 8px", textAlign: "left", color: t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Community</th>
              <th style={{ padding: "10px 8px", textAlign: "left", color: t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Type</th>
              <th style={{ padding: "10px 8px", textAlign: "left", color: t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Beds</th>
              {[{ col: "rentLow", label: "Rent From" }, { col: "rentHigh", label: "Rent To" }].map(h => (
                <th key={h.col} onClick={() => toggleSort(h.col)} style={{ padding: "10px 8px", textAlign: "right", color: sortBy === h.col ? t.accentLight : t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, cursor: "pointer", userSelect: "none" }}>{h.label} {sortBy === h.col ? (sortDir === "desc" ? "\u25BC" : "\u25B2") : ""}</th>
              ))}
              {REFERENCE_POINTS.map(ref => (
                <th key={ref.id} onClick={() => toggleSort("avgScore")} style={{ padding: "10px 8px", textAlign: "center", color: sortBy === "avgScore" ? t.accentLight : t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, cursor: "pointer", userSelect: "none" }}>{ref.emoji} {ref.shortLabel}</th>
              ))}
              <th onClick={() => toggleSort("amenityCount")} style={{ padding: "10px 8px", textAlign: "center", color: sortBy === "amenityCount" ? t.accentLight : t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, cursor: "pointer", userSelect: "none" }}>Amenities {sortBy === "amenityCount" ? (sortDir === "desc" ? "\u25BC" : "\u25B2") : ""}</th>
              <th style={{ padding: "10px 8px", textAlign: "center", color: t.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>{"\uD83D\uDC3E"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((apt, i) => (
              <tr key={apt.name} className="apt-row" onClick={() => setSelectedApt(apt)} style={{ borderBottom: `1px solid ${t.borderLight}`, animation: `fadeIn ${0.15 + i * 0.02}s ease` }}>
                <td style={{ padding: "10px 8px" }}>
                  <input type="checkbox" checked={compareList.some(a => a.name === apt.name)} onChange={e => { e.stopPropagation(); toggleCompare(apt); }} onClick={e => e.stopPropagation()} style={{ accentColor: t.accent }} />
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <div style={{ fontWeight: 600, color: t.text }}>{apt.name}</div>
                  <div style={{ fontSize: 11, color: t.textFaint }}>{apt.address} {"\u00B7"} {areaEmoji[apt.area]} {apt.area}</div>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${typeColors[apt.type]}18`, color: typeColors[apt.type], textTransform: "uppercase", letterSpacing: 0.5 }}>{apt.type}</span>
                </td>
                <td style={{ padding: "10px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.textMuted }}>{apt.beds}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: t.text }}>${apt.rentLow.toLocaleString()}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: t.textMuted }}>${apt.rentHigh.toLocaleString()}</td>
                {apt.scores.map(s => (
                  <td key={s.id} style={{ padding: "10px 8px", textAlign: "center" }}>
                    <span className="score-pill" style={{ background: `${walkColor(s.score)}18`, color: walkColor(s.score) }}>{s.score}</span>
                  </td>
                ))}
                <td style={{ padding: "10px 8px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.textMuted }}>{apt.amenityCount}</td>
                <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 14 }}>{apt.pet ? "\u2705" : "\u274C"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: t.textFaint }}>No apartments match your filters. Try adjusting your criteria.</div>
        )}
      </div>

      {/* COMPARE BAR */}
      {compareList.length > 0 && (
        <div className="compare-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: t.textMuted }}>Compare ({compareList.length}/4):</span>
            {compareList.map(a => (
              <span key={a.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 11, color: t.accentLight }}>
                {a.name}
                <span onClick={() => toggleCompare(a)} style={{ cursor: "pointer", opacity: 0.6 }}>{"\u2715"}</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowCompare(true)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: t.accent, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Compare Side-by-Side</button>
            <button onClick={() => setCompareList([])} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: t.textMuted, fontSize: 12, cursor: "pointer" }}>Clear</button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedApt && (
        <div onClick={() => setSelectedApt(null)} style={{ position: "fixed", inset: 0, background: t.modalBg, backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, animation: "fadeIn 0.2s" }}>
          <div ref={modalRef} onClick={e => e.stopPropagation()} style={{ background: t.bgCard, borderRadius: 20, padding: 32, maxWidth: 560, width: "94%", border: `1px solid ${t.border}`, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${typeColors[selectedApt.type]}18`, color: typeColors[selectedApt.type], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{selectedApt.type}</span>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: t.textStrong, margin: 0 }}>{selectedApt.name}</h2>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{selectedApt.address}, Davis, CA {"\u00B7"} {areaEmoji[selectedApt.area]} {selectedApt.area} Davis</div>
              </div>
              <button onClick={() => setSelectedApt(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: t.textMuted, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2715"}</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 14, borderRadius: 12, background: t.bgInput, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Monthly Rent</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: t.textStrong }}>${selectedApt.rentLow.toLocaleString()} - ${selectedApt.rentHigh.toLocaleString()}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: t.bgInput, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Details</div>
                <div style={{ fontSize: 13, color: t.text }}>{selectedApt.beds} bed {"\u00B7"} {selectedApt.units} units {"\u00B7"} Built {selectedApt.built}</div>
              </div>
            </div>

            {/* Walk Scores */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>Proximity Scores</div>
              {selectedApt.scores.map(s => {
                const ref = REFERENCE_POINTS.find(r => r.id === s.id);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{ref.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: t.text }}>{ref.label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: t.textMuted }}>{s.distance.toFixed(1)} mi {"\u00B7"} {walkLabel(s.score)}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: t.bgInput }}>
                        <div style={{ width: `${s.score}%`, height: "100%", borderRadius: 3, background: walkColor(s.score), transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                    <span className="score-pill" style={{ background: `${walkColor(s.score)}18`, color: walkColor(s.score), minWidth: 40, textAlign: "center" }}>{s.score}</span>
                  </div>
                );
              })}
            </div>

            {/* Amenities */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>Amenities</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selectedApt.amenities.map(am => <span key={am} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: t.accentLight }}>{am}</span>)}
                <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: selectedApt.pet ? "rgba(16,185,129,0.08)" : "rgba(255,61,0,0.08)", border: `1px solid ${selectedApt.pet ? "rgba(16,185,129,0.2)" : "rgba(255,61,0,0.2)"}`, color: selectedApt.pet ? "#10b981" : "#ff3d00" }}>{selectedApt.pet ? "\uD83D\uDC3E Pets Welcome" : "\uD83D\uDEAB No Pets"}</span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: t.textFaint, lineHeight: 1.5 }}>Managed by {selectedApt.mgmt} {"\u00B7"} Data approximate. Contact community for current pricing and availability.</div>
          </div>
        </div>
      )}

      {/* COMPARE MODAL */}
      {showCompare && compareList.length > 0 && (
        <div onClick={() => setShowCompare(false)} style={{ position: "fixed", inset: 0, background: t.modalBg, backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, animation: "fadeIn 0.2s" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.bgCard, borderRadius: 20, padding: 32, maxWidth: 900, width: "96%", border: `1px solid ${t.border}`, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: t.textStrong, margin: 0 }}>Side-by-Side Comparison</h2>
              <button onClick={() => setShowCompare(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: t.textMuted, fontSize: 16, cursor: "pointer" }}>{"\u2715"}</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: t.textDim, fontSize: 10, textTransform: "uppercase" }}></th>
                    {compareList.map(a => <th key={a.name} style={{ padding: "8px 12px", textAlign: "center", color: t.text, fontSize: 13, fontWeight: 600, minWidth: 160 }}>{a.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Rent Range", fn: a => `$${a.rentLow.toLocaleString()} - $${a.rentHigh.toLocaleString()}` },
                    { label: "Beds", fn: a => a.beds },
                    { label: "Units", fn: a => a.units },
                    { label: "Built", fn: a => a.built },
                    { label: "Area", fn: a => `${areaEmoji[a.area]} ${a.area}` },
                    { label: "Type", fn: a => a.type },
                    { label: "Pets", fn: a => a.pet ? "\u2705" : "\u274C" },
                    ...REFERENCE_POINTS.map(ref => ({
                      label: `${ref.emoji} ${ref.shortLabel} Score`,
                      fn: a => { const s = a.scores.find(sc => sc.id === ref.id); return s ? `${s.score} (${s.distance.toFixed(1)}mi)` : "-"; },
                      isScore: true, refId: ref.id,
                    })),
                    { label: "Amenities", fn: a => a.amenities.join(", ") },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                      <td style={{ padding: "8px 12px", color: t.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{row.label}</td>
                      {compareList.map(a => (
                        <td key={a.name} style={{ padding: "8px 12px", textAlign: "center", fontFamily: row.isScore ? "'JetBrains Mono', monospace" : "inherit", color: t.text, fontSize: 12 }}>
                          {row.isScore ? (() => {
                            const s = a.scores.find(sc => sc.id === row.refId);
                            return <span className="score-pill" style={{ background: `${walkColor(s.score)}18`, color: walkColor(s.score) }}>{s.score}</span>;
                          })() : row.fn(a)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${t.borderLight}`, padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: t.footerText, lineHeight: 1.6 }}>
          {"\u00A9"} 2026 mydaviscalifornia.com {"\u00B7"} Rental data is approximate and updated periodically. Contact each community directly for current pricing and availability.
          <br />Walk scores are calculated based on straight-line distance to UC Davis (420 Hutchison Dr) and Downtown Davis (730 3rd St).
        </div>
      </div>
    </div>
  );
}
