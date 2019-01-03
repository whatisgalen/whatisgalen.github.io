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
    // let neighborhoodPolyData = await fetchData("la-county-neighborhoods-v1.geojson");
    let pointsNamed = await fetchData("historic_places1.json");
    // let pointNamed2 = await fetchData("HistoricPlacesLA_2.geojson");

    for(let i = 0; i < pointData.features.length; i++) { 
        pointData.features[i]["properties"] = { //add a prop called "properties" to each feature
            "id": pointData.features[i].id
        }; 
    }
    console.log(pointData.features.length);

    //experimental
    for(let i = 0; i < polyData.features.length;i++) {
        polyData.features[i]["id"] = polyData.features[i].properties.name;
    }

    let collected, hasDensity, noDensity, censusTractsLayers;
    try {
        collected = turf.collect(polyData, pointData, "id", "marker_ids"); //create/populate prop in each poly called marker_ids
        // console.log("pointsNamed:");
        // console.log(pointsNamed);
        for(let i = 0; i < pointsNamed.features.length; i++) {
            let co1 = pointsNamed.features[i].geometry.coordinates[0][0];
            let co2 = pointsNamed.features[i].geometry.coordinates[0][1];
            pointsNamed.features[i].geometry.coordinates = [co1, co2];
            // pointsNamed.features[i].geometry.coordinates.pop();
            pointsNamed.features[i].geometry.type = "Point";
        }
        console.log("pointsNamed:");
        console.log(pointsNamed);
        collected = turf.collect(collected, pointsNamed, "Name", "landmarks");
        console.log(collected);
        for(let i = 0; i < collected.features.length; i++) {
            collected.features[i].properties["density"] = collected.features[i].properties.marker_ids.length;
            
        }
        hasDensity = { "type": "FeatureCollection", "features": [] };
        noDensity = { "type": "FeatureCollection", "features": [] };
        for(let i = 0; i < collected.features.length; i++) {
            if(collected.features[i].properties.density == 0) {
                noDensity.features.push(collected.features[i]);
            } else {
                hasDensity.features.push(collected.features[i]);
            }
        }
        
        // console.log("this is collected:");
        console.log(collected);
   
        buildMap(collected, hasDensity, noDensity);
    } catch(e) {
        console.log(e);
    }
}

async function fetchData(url) {
    // const t0 = performance.now();
    const response = await fetch(url);
    const data = await response.json();
    // console.log("we got: "+data.json());
    // const t1 = performance.now();
    // console.log("fetchData="+((t1-t0)/1000));
    return (data);
}

function buildLayers(collected) {
    // var t0 = performance.now();
    let censusTractsLayers = [];

        censusTractsLayers.push(
            {
                id: "tracts-outline",
                type: "line",
                source: {
                    type: 'geojson',
                    data: collected
                },
                paint: {
                    "line-color": ["case", ["boolean", ["feature-state", "hover"], !1], "#383838", "rgb(193, 193, 193)"],
                    "line-width": ["case", ["boolean", ["feature-state", "hover"], !1], 3, 1]
                }
            },
            {
                id: ('tractPoly1'),
                type: 'fill-extrusion',
                source: {
                    type: 'geojson',
                    data: collected
                },
                paint: 
                {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'density'],
                        1, '#00ffff',
                        50, '#0feffe',
                        100, '#1edffd',
                        150, '#2dcffc',
                        200, '#3cbffb',
                        250, '#4baffa',
                        300, '#5a9ff9',
                        350, '#698ff8',
                        400, '#787ff7',
                        450, '#876ff6',
                        500, '#965ff5',
                        550, '#a54ff4',
                        600, '#b43ff3',
                        650, '#c32ff2',
                        700, '#d21ff1',
                        750, '#e10ff0'


                        // 0, '#f5f5f5',
                        // 50, '#d1ffff',
                        // 100, '#a1ffff',
                        // 150, '#71ffff',
                        // 200, '#41ffff',
                        // 250, '#11ffff',
                        // 300, '#00efff',
                        // 350, '#00d6ff',
                        // 400, '#00bdff',
                        // 450, '#00a4ff',
                        // 500, '#0073ef',
                        // 550, '#005cbf',
                        // 600, '#00458f',
                        // 650, '#002e5f',
                        // 700, '#00172f'
                    ],
                    'fill-extrusion-opacity': 0.6,
                    'fill-extrusion-height': [
                        "+", ["*", ["get", "density"], 15], ["case", ["boolean", ["feature-state", "hover"], !1], 1e3, 0]
                    ],
                    "fill-extrusion-base": ["case", ["boolean", ["feature-state", "hover"], !1], 1e3, 0],
        
                     
                }
            }
        )
    // var t1 = performance.now();
    // console.log("BuildLayers="+((t1-t0)/1000)); 
    return censusTractsLayers;
}

function buildMap(collected, hasDensity, noDensity) {
    // var t0 = performance.now();
    let hoveredStateId = null;
    map.on('load', ()=> {

        //build panels
        const layers = ['1-49', '50-99', '100-149', '150-199', '200-249', '250-299', '300-349', '350-399','400-449','450-499','500-549','550-599','600-649','650-699','700-749','750+'];
        // const colors = ['#ffffff', '#d1ffff', '#a1ffff', '#71ffff', '#41ffff', '#11ffff', '#00efff', '#00d6ff','#00bdff','#00a4ff','#0073ef','#005cbf','#00458f','#002e5f','#00172f'];
        const colors = [
            '#ccffff',
            '#0feffe',
            '#1edffd',
            '#2dcffc',
            '#3cbffb',
            '#4baffa',
            '#5a9ff9',
            '#698ff8',
            '#787ff7',
            '#876ff6',
            '#965ff5',
            '#a54ff4',
            '#b43ff3',
            '#c32ff2',
            '#d21ff1',
            '#e10ff0'
        ];
        for (let i = 0; i < layers.length; i++) {
            let layer = layers[i];
            let color = colors[i];
            let item = document.createElement('div');
            let key = document.createElement('span');
            key.className = 'legend-key';
            key.style.backgroundColor = color;
          
            let value = document.createElement('span');
            value.innerHTML = layer;
            item.appendChild(key);
            item.appendChild(value);
            legend.appendChild(item);
          }


        //add source(s)
        map.addSource('collected-tracts', {
            type: 'geojson',
            data: collected
        });
        map.addSource('dense-tracts', {
            type: 'geojson',
            data: hasDensity
        });
        map.addSource('flat-tracts', {
            type: 'geojson',
            data: noDensity
        });

        //add layers
        map.addLayer(
            {
                id: "tracts-outline",
                type: "line",
                source: 'collected-tracts',
                paint: {
                    // "line-color": ["case", ["boolean", ["feature-state", "hover"], false], "#383838", "rgb(193, 193, 193)"],
                    "line-color": "rgb(193, 193, 193)",
                    "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 5, 1]
                }
            });
        map.addLayer(
            {
                id: "tracts-extruded",
                type: 'fill-extrusion',
                source: 'dense-tracts',
                paint: 
                {
                    "fill-extrusion-height": [
                        "+", ["*", ["get", "density"], 15], ["case", ["boolean", ["feature-state", "hover"], false], 1e3, 0]
                    ],
                    "fill-extrusion-base": ["case", ["boolean", ["feature-state", "hover"], false], 1e3, 0],
                    "fill-extrusion-color": {
                        property: "density",
                        stops: 
                        [[1, '#ccffff'],
                        [50, '#0feffe'],
                        [100, '#1edffd'],
                        [150, '#2dcffc'],
                        [200, '#3cbffb'],
                        [250, '#4baffa'],
                        [300, '#5a9ff9'],
                        [350, '#698ff8'],
                        [400, '#787ff7'],
                        [450, '#876ff6'],
                        [500, '#965ff5'],
                        [550, '#a54ff4'],
                        [600, '#b43ff3'],
                        [650, '#c32ff2'],
                        [700, '#d21ff1'],
                        [750, '#e10ff0']]
                    },
                    "fill-extrusion-opacity": 0.55
                      
                }
            });
            map.addLayer(
                {
                    id: "tracts-non-extruded",
                    type: 'fill-extrusion',
                    source: 'flat-tracts',
                    paint: 
                    {
                        "fill-extrusion-height": 0,
                        "fill-extrusion-base": 0,
                        // "fill-extrusion-color": {},
                        "fill-extrusion-opacity": 0
                          
                    }
                });
    // });
    // var t1 = performance.now();
    // console.log("BuildMap="+((t1-t0)/1000));

    //let popup = new mapboxgl.Popup();

    
    map.on("mousemove", "tracts-extruded", (e)=> {
        
        if(e.features.length > 0) {
            if(hoveredStateId) { 
                map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, { hover: false});
                map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: false});
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, {hover: true});
            map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: true});
            // console.log(e.features[0].id);
        }
        
    });
    map.on("mousemove", "tracts-non-extruded", (e)=> {
        
        if(e.features.length > 0) {
            if(hoveredStateId) { 
                map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, {hover: false});
                map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, { hover: false});
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: true});
            // console.log(e.features[0].id);
        
        }
    });

    map.on("mouseleave", "tracts-extruded", ()=> {
        if(hoveredStateId) {
            map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, {hover: false});
            map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: false});
        }
        hoveredStateId = null;
    });

    map.on("mouseleave", "tracts-non-extruded", ()=> {
        if(hoveredStateId) {
            map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, {hover: false});
            map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: false});
        }
        hoveredStateId = null;
    });

    map.on('mousemove', (e)=> {
        let features = map.queryRenderedFeatures(e.point);
    
        if (features.length > 0) {
            let amount = features[0].properties.density;
            let msg = "";
            let landmarks = JSON.parse(features[0].properties.landmarks);
            // console.log(landmarks);
            // let landmark = ("Local Landmark: "+ landmarks[Math.floor(Math.random()*landmarks.length)]);
            let landmark = ("Local Landmark: "+ landmarks[0]);
            if(amount === 0) {
                amount = "Zero";
                msg = " Try somewhere else maybe?";
            }
            if(landmarks.length < 1) landmark = "";
            document.getElementById('pd').innerHTML = '<h3><strong>ct#' + features[0].properties.name + '</strong></h3><p><strong><em>' + amount + '</strong> historical landmark(s) here!'+msg+'</em></p><p>'+landmark+'</p>';
        } else {
            document.getElementById('pd').innerHTML = '<p>Hover over a census tract!</p>';
        }
        map.getCanvas().style.cursor = features.length ? 'pointer' : ''; 
    });

    // map.on("mouseleave", "tracts-outline", ()=> {
    //     if(hoveredStateId) {
    //         map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: false});
    //     }
    //     hoveredStateId = null;
    // });

    // map.on('click', function(e) {});
    });
}

