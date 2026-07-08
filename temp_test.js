(async () => { let allStops = ['Natekal', 'Deralakatte', 'State Bank']; let btn = {}; let statusEl = {}; let document = {getElementById:()=>({style:{}})}; let conductorSocket = {emit:()=>{}}; let busId = 1; let journeyActive = true; let journeyInterval; let addNotification=()=>{}; 
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
                     const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(stop + ' Mangalore')}`);
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
             const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${routeEndpoints.join(';')}?overview=full&geometries=geojson`;
             const osrmRes = await fetch(osrmUrl);
             const data = await osrmRes.json();
             
             if (!data || !data.routes || data.routes.length === 0) {
                 throw new Error("No route found from OSRM");
             }
             
             const coords = data.routes[0].geometry.coordinates;
             
             btn.innerHTML = `<i class="fas fa-stop"></i> Stop Journey`;
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

             simCoords = coords;
             simStopIndices = stopIndices;
             simAllStops = allStops;
             simCurrentIndex = 0;
             simCurrentStopIndex = 0;
             simWaitTicks = 15;
             simIsWaiting = true;
             
             const manualStopSelect = document.getElementById("manualNextStop");
             manualStopSelect.innerHTML = allStops.map((stop, i) => `<option value="${i}">${stop}</option>`).join("");

             conductorSocket.emit("conductor_location_update", {
              busId,
              nextStop: `ARRIVED AT: ${allStops[0]}`,
              lat: coords[0][1],
              lng: coords[0][0],
              routeCoordinates: coords
            });

            statusEl.textContent = `Status: Stopped at ${allStops[0]} (15s)`;
            
            document.getElementById("nextStopBanner").style.display = 'block';
            document.getElementById("nextStopBanner").textContent = `NEXT STOP: ${allStops[0]}`;

            journeyInterval = setInterval(() => {
              if (!journeyActive) {
                clearInterval(journeyInterval);
                return;
              }
              
              if (simIsWaiting) {
                simWaitTicks--;
                if (simWaitTicks <= 0) {
                  simIsWaiting = false;
                  simCurrentStopIndex++;
                  if (simCurrentStopIndex < simAllStops.length) {
                    const nxtStop = simAllStops[simCurrentStopIndex];
                    conductorSocket.emit("conductor_location_update", {
                      busId,
                      nextStop: `NEXT STOP: ${nxtStop}`
                    });
                    const manualSel = document.getElementById("manualNextStop");
                    if (manualSel) manualSel.value = simCurrentStopIndex;
                    document.getElementById("nextStopBanner").textContent = `NEXT STOP: ${nxtStop}`;
                    statusEl.textContent = `Status: Driving to ${nxtStop}`;
                  } else {
                    clearInterval(journeyInterval);
                    journeyActive = false;
                    btn.innerHTML = `<i class="fas fa-play"></i> Start Journey`;
                    btn.style.background = 'var(--primary)';
                    statusEl.textContent = `Status: Journey Completed`;
                    addNotification("Journey Ended", "Reached final destination", "info");
                    document.getElementById("nextStopBanner").style.display = 'none';
                  }
                }
                return;
              }
              
              simCurrentIndex += 1;
              if (simCurrentIndex >= simCoords.length) simCurrentIndex = simCoords.length - 1;
              
              const currentPoint = simCoords[simCurrentIndex];
              conductorSocket.emit("conductor_location_update", {
                busId,
                lat: currentPoint[1],
                lng: currentPoint[0],
                routeCoordinates: simCoords
              });
              
              if (simCurrentStopIndex < simAllStops.length && simCurrentIndex >= simStopIndices[simCurrentStopIndex]) {
                simIsWaiting = true;
                simWaitTicks = 15;
                const arrStop = simAllStops[simCurrentStopIndex];
                conductorSocket.emit("conductor_location_update", {
                  busId,
                  nextStop: `ARRIVED AT: ${arrStop}`
                });
                statusEl.textContent = `Status: Stopped at ${arrStop} (15s)`;
                addNotification("Bus Stopped", `Arrived at ${arrStop}`, "success");
              }
            }, 1000);
            
          })().catch(console.error);