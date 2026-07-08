const query = '[out:json];(way["name"~"manjanady",i](12.78,74.89,12.80,74.91);node["name"~"manjanady",i](12.78,74.89,12.80,74.91););out center;';

fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: query
})
.then(r => r.json())
.then(data => {
  console.log(JSON.stringify(data.elements, null, 2));
})
.catch(e => console.error(e));
