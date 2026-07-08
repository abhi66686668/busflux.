const fs = require('fs');
let html = fs.readFileSync('frontend/conductor.html', 'utf8');

// Replace the entire toggleJourney function and add the simulation functions.
const newCode = `
    let journeyActive = false;
    let watchId = null;
    let conductorSocket = null;
    let journeyInterval = null;

    function toggleJourney() {
      const busId = document.getElementById("liveBusSelect").value;
      if (!busId) {
        alert("Please select a bus.");
        return;
      }
      const btn = document.getElementById("startJourneyBtn");
      const statusEl = document.getElementById("journeyStatus");
      
      if (!conductorSocket) {
         conductorSocket = io(API.replace('/api', ''));
      }

      if (!journeyActive) {
        journeyActive = true;
        btn.innerHTML = \`<i class="fas fa-spinner fa-spin"></i> Fetching Route...\`;
        btn.style.background = 'var(--primary-dark)';
        statusEl.innerHTML = \`<span style="color:var(--success)"><i class="fas fa-circle-check"></i> Journey Active (Simulation...)</span>\`;
        
        const bus = buses.find(b => b._id === busId);
        const rawStops = bus ? [bus.from, ...(bus.stops || []), bus.to] : [];
        const allStops = rawStops.filter((stop, idx, arr) => idx === 0 || stop !== arr[idx - 1]);
        
        const stopCoordinates = {
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
          "mangalore": [74.8436, 12.8700]
        };

        function getDistSq(p1, p2) {
          return (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2;
        }

        async function fetchRealisticRoute() {
          try {
             let validCoords = [];
             let stopRealCoords = [];
             
             for (let stop of allStops) {
                let key = stop.toLowerCase().trim();
                let coord = null;
                if (stopCoordinates[key]) {
                   coord = stopCoordinates[key];
                   validCoords.push(coord.join(','));
                } else {
                   try {
                     const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(stop + ' Mangalore')}\`);
                     const data = await res.json();
                     if (data && data.length > 0) {
                        coord = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
                        validCoords.push(coord.join(','));
                     }
                   } catch(e) { console.error("Nominatim error", e); }
                }
                stopRealCoords.push(coord);
             }
             
             if (validCoords.length < 2) {
                validCoords = ["74.8436,12.8700", "74.8698,12.8158"];
             }
             
             // Generate a smooth route using only Start and End to avoid OSRM U-turn detours for intermediate waypoints
             const routeEndpoints = [validCoords[0], validCoords[validCoords.length - 1]];
             const osrmUrl = \`https://router.project-osrm.org/route/v1/driving/\${routeEndpoints.join(';')}?overview=full&geometries=geojson\`;
             const osrmRes = await fetch(osrmUrl);
             const data = await osrmRes.json();
             
             if (!data || !data.routes || data.routes.length === 0) {
                 throw new Error("No route found from OSRM");
             }
             
             const coords = data.routes[0].geometry.coordinates;
             
             btn.innerHTML = \`<i class="fas fa-stop"></i> Stop Journey\`;
             btn.style.background = "var(--danger)";
             
             let stopIndices = [];
             for (let i = 0; i < allStops.length; i++) {
                let targetCoord = stopRealCoords[i];
                if (!targetCoord) {
                  stopIndices.push(Math.floor(coords.length * (i / (allStops.length - 1))));
                  continue;
                }
                
                let minDist = Infinity;
                let minIdx = 0;
                for (let j = 0; j < coords.length; j++) {
                  let d = getDistSq(targetCoord, coords[j]);
                  if (d < minDist) {
                    minDist = d;
                    minIdx = j;
                  }
                }
                stopIndices.push(minIdx);
             }
             
             for (let i = 1; i < stopIndices.length; i++) {
                if (stopIndices[i] <= stopIndices[i-1]) stopIndices[i] = stopIndices[i-1] + 1;
             }
             if (stopIndices[stopIndices.length - 1] >= coords.length) {
                stopIndices[stopIndices.length - 1] = coords.length - 1;
             }

             startSimulation(coords, stopIndices, allStops);
             
          } catch(err) {
             console.error("Geocoding/Routing Error:", err);
             alert("Failed to load realistic route.");
             journeyActive = false;
             btn.innerHTML = \`<i class="fas fa-play"></i> Start Journey\`;
          }
        }
        
        function startSimulation(coords, stopIndices, allStops) {
            let currentIndex = 0;
            let currentStopIndex = 0;
            
            statusEl.textContent = \`Status: Stopped at \${allStops[0]} (15s)\`;
            
            conductorSocket.emit("conductor_location_update", {
              busId,
              nextStop: \`ARRIVED AT: \${allStops[0]}\`,
              lat: coords[0][1],
              lng: coords[0][0],
              routeCoordinates: coords
            });
            
            let isWaiting = true;
            let waitTicks = 15;

            journeyInterval = setInterval(() => {
              if (!journeyActive) {
                clearInterval(journeyInterval);
                return;
              }
              
              if (isWaiting) {
                waitTicks--;
                if (waitTicks <= 0) {
                  isWaiting = false;
                  currentStopIndex++;
                  if (currentStopIndex < allStops.length) {
                    const nxtStop = allStops[currentStopIndex];
                    conductorSocket.emit("conductor_location_update", {
                      busId,
                      nextStop: nxtStop
                    });
                    const manualSel = document.getElementById("manualNextStop");
                    if (manualSel) manualSel.value = nxtStop;
                    statusEl.textContent = \`Status: Driving to \${nxtStop}\`;
                    addNotification("Departed", \`Heading to \${nxtStop}\`, "info");
                  }
                }
                return;
              }
              
              if (currentIndex >= coords.length - 1) {
                clearInterval(journeyInterval);
                journeyActive = false;
                btn.innerHTML = \`<i class="fas fa-play"></i> Start Journey\`;
                statusEl.textContent = "Status: Journey Completed!";
                addNotification("Journey Complete", "Bus reached the final destination.", "success");
                
                conductorSocket.emit("conductor_location_update", {
                  busId,
                  nextStop: "ARRIVED: " + allStops[allStops.length - 1]
                });
                return;
              }
              
              currentIndex += 2;
              if (currentIndex >= coords.length) currentIndex = coords.length - 1;
              
              const currentPoint = coords[currentIndex];
              conductorSocket.emit("conductor_location_update", {
                busId,
                lat: currentPoint[1],
                lng: currentPoint[0]
              });
              
              // The critical fix: use ARRIVAL_THRESHOLD_SQ for checking closeness rather than raw index,
              // or just ensure the stops don't double trigger! Wait, using stopIndices is fine as long as they are distinct.
              // We'll just stick to the index-based approach but verify!
              if (currentStopIndex < allStops.length && currentIndex >= stopIndices[currentStopIndex]) {
                isWaiting = true;
                waitTicks = 15;
                const arrStop = allStops[currentStopIndex];
                conductorSocket.emit("conductor_location_update", {
                  busId,
                  nextStop: \`ARRIVED AT: \${arrStop}\`
                });
                statusEl.textContent = \`Status: Stopped at \${arrStop} (15s)\`;
                addNotification("Bus Stopped", \`Arrived at \${arrStop}\`, "success");
              }
            }, 1000);
        }
        
        fetchRealisticRoute();
      } else {
        journeyActive = false;
        btn.innerHTML = \`<i class="fas fa-play"></i> Start Journey\`;
        btn.style.background = 'var(--primary)';
        statusEl.innerHTML = \`Status: Not Started\`;
        if (journeyInterval) {
          clearInterval(journeyInterval);
        }
      }
    }
`;

const oldCodeRegex = /let journeyActive = false;[\s\S]*?function toggleJourney\(\) \{[\s\S]*?btn\.style\.background = 'var\(--primary\)';\s*status\.innerHTML = `Status: Not Started`;\s*if \(watchId\) \{\s*navigator\.geolocation\.clearWatch\(watchId\);\s*\}\s*\}/;

html = html.replace(oldCodeRegex, newCode);
fs.writeFileSync('frontend/conductor.html', html);
console.log("Patched!");
