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
    let pointsNamed = await fetchData("HistoricPlacesLA_1.json");

    for(let i = 0; i < pointData.features.length; i++) { 
        pointData.features[i]["properties"] = { //add a prop called "properties" to each feature
            "id": pointData.features[i].id
        }; 
    }
    // console.log(pointData.features.length);

    for(let i = 0; i < polyData.features.length;i++) {
        polyData.features[i]["id"] = polyData.features[i].properties.name;
    }

    let collected, hasDensity, noDensity;
    try {
        collected = turf.collect(polyData, pointData, "id", "marker_ids"); //create/populate prop in each poly called marker_ids
        //re-insert coordinates as an array, not geom.properties
        for(let i = 0; i < pointsNamed.features.length; i++) {
            let co1 = pointsNamed.features[i].geometry.coordinates[0][0];
            let co2 = pointsNamed.features[i].geometry.coordinates[0][1];
            pointsNamed.features[i].geometry.coordinates = [co1, co2];
            pointsNamed.features[i].geometry.type = "Point";
        }
        console.log("pointsNamed:");
        console.log(pointsNamed);
        collected = turf.collect(collected, pointsNamed, "Name", "landmarkNames");
        collected = turf.collect(collected, pointsNamed, "arches_id", "landmark_ids");
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

function buildMap(collected, hasDensity, noDensity) {
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


        //add sources
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
                        "fill-extrusion-opacity": 0  
                    }
            });
    
            //show outline/hover for positive density tracts
        map.on("mousemove", "tracts-extruded", (e)=> {
            if(e.features.length > 0) {
                if(hoveredStateId) { 
                    map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, { hover: false});
                    map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: false});
                }
                hoveredStateId = e.features[0].id;
                map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, {hover: true});
                map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: true});
            }
        });
        //show outline/hover for zero-density tracts
        map.on("mousemove", "tracts-non-extruded", (e)=> {
            if(e.features.length > 0) {
                if(hoveredStateId) { 
                    map.setFeatureState({source: 'dense-tracts', id: hoveredStateId}, {hover: false});
                    map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, { hover: false});
                }
                hoveredStateId = e.features[0].id;
                map.setFeatureState({source: 'collected-tracts', id: hoveredStateId}, {hover: true});
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
                if(amount === 0) {
                    amount = "Zero";
                    msg = " Try somewhere else maybe?";
                }
                
                document.getElementById('pd').innerHTML = '<h3><strong>ct#' + features[0].properties.name + '</strong></h3><p><strong><em>' + amount + '</strong> historical landmark(s) here!'+msg+'</em></p>';
            } else {
                document.getElementById('pd').innerHTML = '<p>Hover over a census tract!</p>';
            }
            map.getCanvas().style.cursor = features.length ? 'pointer' : ''; 
        });

        map.on('click', function(e) {          
            let features = map.queryRenderedFeatures(e.point);
            let html = "";
            if(!features.length) {return;}
            let lM = JSON.parse(features[0].properties.landmarkNames);
            let uuids = JSON.parse(features[0].properties.landmark_ids);
            if (features[0].properties.density < 1 && lM.length < 1) {
                return;
            } else if (features[0].properties.density >= 1 && lM.length < 1) {
                html = ('<h3>No landmark names available for this subset</h3>');
            } else {
                let randInt = Math.floor(Math.random()*lM.length);
                let text = lM[randInt];
                let uuid = uuids[randInt];
                let link = '<a href=\"http://www.historicplacesla.org/reports/'+uuid+'\" target=\"_blank\">'+text+'</a>';
                console.log(lM);
                html = ('<h3>'+ link+' is here!</h3>');
            }
            var popup = new mapboxgl.Popup({ offset: [0, -15] })
                .setLngLat([e.lngLat.lng, e.lngLat.lat])
                .setHTML(html)
                .setLngLat([e.lngLat.lng, e.lngLat.lat])
                .addTo(map);
        });
    });
}

