const query = `[out:json]; area[name="Dakshina Kannada"]->.searchArea; node["name"~"Badria Juma Masjid",i](area.searchArea); out body;`;
fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
}).then(r=>r.json()).then(data => console.log(JSON.stringify(data.elements, null, 2)));
