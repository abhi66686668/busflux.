const stops = ['Montepadavu', 'Kallukatta', 'Natekal', 'Kannachur', 'Deralakatte', 'K.S. Hegde Hospital', 'Kuthar Junction', 'Babbukatte', 'Thokkottu', 'Mugeru', 'Pumpwell', 'Kankanady', 'Jyothi', 'Balmatta', 'State Bank'];
async function geocode() {
  for (let s of stops) {
    const res = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(s + ' Mangalore') + '&format=json&limit=1', {
      headers: { 'User-Agent': 'BusFlux2/1.0 (test)' }
    });
    try {
      const data = await res.json();
      if (data.length > 0) {
        console.log('"' + s.toLowerCase() + '": [' + data[0].lat + ', ' + data[0].lon + '],');
      } else {
        console.log('// Not found: ' + s);
      }
    } catch(e) { console.error("Error for", s); }
    await new Promise(r => setTimeout(r, 2000));
  }
}
geocode();
