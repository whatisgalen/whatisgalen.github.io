mapboxgl.accessToken = 'pk.eyJ1Ijoid2hhdGlzZ2FsZW4iLCJhIjoiY2pwenNsc3FtMGZkazQydWlyZDVkYWVrNyJ9.wZLeR_R1KCgyd1EltvVa1w';
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-118.2442299,34.0150391],
    zoom: 11 //start zoom
});

main();
  
async function main() {
    
    const polyData = await fetchData("census_tracts.json");
    let pointData = await fetchData("historic_markers.json");

    for(let i = 0; i < pointData.features.length; i++) { 
        pointData.features[i]["properties"] = { //add a prop called "properties" to each feature
            "id": pointData.features[i].id
        }; 
    }

    let collected, censusTractsLayers;
    try {
        collected = turf.collect(polyData, pointData, "id", "marker_ids"); //create/populate prop in each poly called marker_ids
        for(let i = 0; i < collected.features.length; i++) {
            collected.features[i].properties["density"] = collected.features[i].properties.marker_ids.length;
        }
        censusTractsLayers = buildLayers(collected);
        buildMap(censusTractsLayers);
    } catch(e) {
        console.log(e);
    }
}

async function fetchData(url) {
    const t0 = performance.now();
    const response = await fetch(url);
    const data = await response.json();
    // console.log("we got: "+data.json());
    const t1 = performance.now();
    console.log("fetchData="+((t1-t0)/1000));
    return (data); //was: json.data();
}

function buildLayers(collected) {
    var t0 = performance.now();
    let censusTractsLayers = [];

        censusTractsLayers.push(
            {
                id: ('tractPoly1'),
                type: 'fill-extrusion',
                source: {
                    type: 'geojson',
                    data: collected
                },
                paint: {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'density'],
                        0, '#ffffcc',
                        5, '#ffcc99',
                        10, '#ff5500',
                        20, '#cc0066',
                        30, '#0000ff',
                        40, '#00ccff',
                        50, '#00e600'
                    ],
                    'fill-extrusion-opacity': 0.5,
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['get', 'density'],
                        
                        0, 0,
                        1, 100,
                        2, 200,
                        3, 300,
                        4, 400,
                        5, 500,
                        6, 600,
                        7, 700,
                        8, 800,
                        9, 900,
                        10, 1000,
                        11, 1100,
                        12, 1200,
                        13, 1300,
                        14, 1400,
                        15, 1500,
                        16, 1600,
                        17, 1700,
                        18, 1800,
                        19, 1900,
                        20, 2000,
                        21, 2100,
                        22, 2200,
                        23, 2300,
                        24, 2400,
                        25, 2500,
                        26, 2600,
                        27, 2700,
                        28, 2800,
                        29, 2900,
                        30, 3000,
                        31, 3100,
                        32, 3200,
                        33, 3300,
                        34, 3400,
                        35, 3500,
                        36, 3600,
                        37, 3700,
                        38, 3800,
                        39, 3900,
                        40, 4000,
                        41, 4100,
                        42, 4200,
                        43, 4300,
                        44, 4400,
                        45, 4500,
                        46, 4600,
                        47, 4700,
                        48, 4800,
                        49, 4900,
                        50, 5000
                    ],
                }
            }
        )
    var t1 = performance.now();
    console.log("BuildLayers="+((t1-t0)/1000)); 
    return censusTractsLayers;
}

function buildMap(censusTractsLayers) {
    var t0 = performance.now();
    map.on('load', ()=> {
        for(let m = 0; m < censusTractsLayers.length; m++) {
            map.addLayer(censusTractsLayers[m]);
        }
    });
    var t1 = performance.now();
    console.log("BuildMap="+((t1-t0)/1000));

//   let popup = new mapboxgl.Popup();

map.on('mousemove', function(e) {
  let features = map.queryRenderedFeatures(e.point ) //
  if (!features.length) {
//     popup.remove();
    return;
  }


  map.getCanvas().style.cursor = features.length ? 'pointer' : '';
});

map.on('click', function(e) {
  
  });
}

