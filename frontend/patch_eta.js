const fs = require('fs');
const path = 'script.js';
let content = fs.readFileSync(path, 'utf8');

const fetchStopsCode = `
  // Fetch bus to populate personal ETA dropdowns
  fetch(\`\${API_BASE_URL}/buses\`)
    .then(res => res.json())
    .then(buses => {
       const bus = buses.find(b => b._id === busId);
       if (bus) {
           let allStops = [bus.from, ...(bus.stops || []), bus.to];
           const bSelect = document.getElementById("myBoardingStop");
           const dSelect = document.getElementById("myDropoffStop");
           if (bSelect && dSelect) {
               const opts = \`<option value="">-- Select --</option>\` + allStops.map(s => {
                   let name = s.replace(/^NEXT STOP:\\s*/i, "").trim();
                   return \`<option value="\${name}">\${name}</option>\`;
               }).join("");
               bSelect.innerHTML = opts;
               dSelect.innerHTML = opts;
           }
       }
    }).catch(err => console.error("Failed to fetch bus for ETA dropdowns:", err));

  // Init tracking data object
  window._currentTrackingData = {
    routeCoords: null,
    currentLat: null,
    currentLng: null,
    effectiveSpeed: 35,
    stopCoordinates: {
        "manjandy": [74.9018, 12.7925],
        "manjanady": [74.9018, 12.7925],
        "manjanadi": [74.9018, 12.7925],
        "thaudugoli": [74.8967, 12.8021],
        "natekal": [74.8885, 12.8122],
        "deralakatte": [74.8698, 12.8158],
        "kuthar": [74.8631, 12.8242],
        "thokkottu": [74.8550, 12.8273],
        "nagori": [74.8615, 12.8610],
        "pumpwell": [74.8580, 12.8643],
        "kankanady": [74.8540, 12.8683],
        "balmatta": [74.8490, 12.8685],
        "jyothi": [74.8465, 12.8708],
        "jyothi circle": [74.8465, 12.8708],
        "hampankatta": [74.8415, 12.8687],
        "state bank": [74.8415, 12.8687],
        "mangalore": [74.8436, 12.8700],
        "montepadavu": [74.9224, 12.8021],
        "kallukatta": [74.9120, 12.8080],
        "kannachur": [74.8810, 12.8135],
        "k.s. hegde hospital": [74.8670, 12.8170],
        "kuthar junction": [74.8631, 12.8242],
        "babbukatte": [74.8600, 12.8250],
        "mugeru": [74.8560, 12.8400]
    }
  };

  window.updatePersonalETA = function() {
      const boarding = document.getElementById("myBoardingStop")?.value;
      const dropoff = document.getElementById("myDropoffStop")?.value;
      const etaDisplay = document.getElementById("personalEtaDisplay");
      
      if (!etaDisplay || !window._currentTrackingData.routeCoords || !boarding) {
          if(etaDisplay) etaDisplay.style.display = 'none';
          return;
      }
      
      const d = window._currentTrackingData;
      const route = d.routeCoords; // Array of [lon, lat]
      
      const getClosestIdx = (lon, lat) => {
          let minDist = Infinity;
          let idx = 0;
          for(let i=0; i<route.length; i++) {
              const dist = (route[i][0]-lon)**2 + (route[i][1]-lat)**2;
              if(dist < minDist) { minDist = dist; idx = i; }
          }
          return idx;
      };
      
      const getDistBetween = (idx1, idx2) => {
          if (idx1 >= idx2) return 0;
          let dist = 0;
          for(let i=idx1; i<idx2; i++) {
              dist += getDistanceFromLatLonInKm(route[i][1], route[i][0], route[i+1][1], route[i+1][0]);
          }
          return dist;
      };
      
      const bCoord = d.stopCoordinates[boarding.toLowerCase()];
      const dpCoord = dropoff ? d.stopCoordinates[dropoff.toLowerCase()] : null;
      
      if (!bCoord) return;
      
      const busIdx = getClosestIdx(d.currentLng, d.currentLat);
      const boardingIdx = getClosestIdx(bCoord[0], bCoord[1]);
      
      let text = "";
      if (busIdx >= boardingIdx - 2) { 
          text = \`Boarding: Passed\`;
      } else {
          const distToBoarding = getDistBetween(busIdx, boardingIdx);
          const etaB = Math.max(1, Math.round((distToBoarding / d.effectiveSpeed) * 60));
          text = \`Boarding ETA: \${etaB} min\`;
      }
      
      if (dpCoord) {
          const dropIdx = getClosestIdx(dpCoord[0], dpCoord[1]);
          if (busIdx >= dropIdx - 2) {
              text += \` | Drop: Passed\`;
          } else {
              const distToDrop = getDistBetween(busIdx, dropIdx);
              const etaD = Math.max(1, Math.round((distToDrop / d.effectiveSpeed) * 60));
              text += \` | Drop ETA: \${etaD} min\`;
          }
      }
      
      etaDisplay.style.display = 'block';
      etaDisplay.textContent = text;
  };

  // Removed red dot logic per user request
`;

// Insert after `trackingMap.stopMarkers = [];`
content = content.replace(/trackingMap\.stopMarkers = \[\];\s*\n\s*\/\/\s*Removed red dot logic per user request/, fetchStopsCode);

// Inject tracking data update in socket listener
const etaUpdateCode = `
          window._currentTrackingData.routeCoords = trackingRouteCoords;
          window._currentTrackingData.currentLat = data.lat;
          window._currentTrackingData.currentLng = data.lng;
          window._currentTrackingData.effectiveSpeed = effectiveSpeedForETA;
          if (window.updatePersonalETA) window.updatePersonalETA();

          if (remainingDist > 0.1) {
`;

content = content.replace(/if\s*\(remainingDist > 0\.1\)\s*\{/, etaUpdateCode);

fs.writeFileSync(path, content, 'utf8');
console.log("ETA logic injected.");
