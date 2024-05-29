// Initialize the map
var map = L.map('map').setView([33.7490, -84.3880], 10); // Atlanta coordinates

// Add a custom Mapbox basemap layer
L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
    maxZoom: 18,
    accessToken: 'pk.eyJ1IjoicW5uIiwiYSI6ImNsczB0aG1zMTA0YTAycXA1NG0xNWtmbW0ifQ.0ebmaE5q7kqQ0tTSxdhugQ'
}).addTo(map);

/* Georgia county boundaries from https://arc-garc.opendata.arcgis.com/datasets/dc20713282734a73abe990995de40497_68/explore?location=32.569175%2C-83.347392%2C7.96
*/
var countyBoundaries = new L.GeoJSON.AJAX('assets/Counties_Georgia.geojson', {
    style: {
        fillColor: 'none', // remove fill color
        color: 'black', 
        weight: 1, 
        opacity: 0.3 
    }
});
countyBoundaries.addTo(map);

// I used the Yelp API Web Scraper from the previous GEOG450 class and modified it to get data for my own use
var cafeLayer = new L.GeoJSON.AJAX('assets/myData.geojson', {
    pointToLayer: function (feature, latlng) {
        // Define custom colors based on rating
        var rating = feature.properties.rating;
        var color;
        if (rating >= 4.5) {
            color = 'blue'; // High rating
        } else if (rating >= 3.0) {
            color = 'yellow'; // Medium rating
        } else {
            color = 'red'; // Low rating
        }

        // Circle marker
        return L.circleMarker(latlng, {
            radius: 8,
            fillColor: color,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
    },
    onEachFeature: function (feature, layer) {
        // Customize popups for each feature
        if (feature.properties && feature.properties.name) {
            // Check if the marker is visible (opacity > 0)
            if (layer.options.opacity > 0) {
                layer.bindPopup('<strong>' + feature.properties.name + '</strong>' +
                                '<br> Rating: ' + feature.properties.rating +
                                '<br> # of Reviews: ' + feature.properties.reviews +
                                '<br> Location: ' + feature.properties.city + ', ' + feature.properties.state +
                                '<br> Address: ' + feature.properties.address + ', ' + feature.properties.postcode);
            }
        }
    }
});
cafeLayer.addTo(map);

// Lines
var lineFeatures = L.featureGroup().addTo(map);
var geojsonLineFeatures = {
"type": "FeatureCollection",
    "features": [
        {
        "type": "Feature",
        "properties": {
            "name": "Georgia State University"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
            [33.95614684001508, -83.98787794315467],
            [33.75343043065918, -84.38530082347748]
            ]
        }
        },
        {
        "type": "Feature",
        "properties": {
            "name": "Georgia State University (Alpharetta)"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
            [33.95614684001508, -83.98787794315467],
            [34.060987853958096, -84.25418562373245]
            ]
        }
        },
        {
        "type": "Feature",
        "properties": {
            "name": "University of Georgia"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
            [33.95614684001508, -83.98787794315467],
            [33.94123274781208, -83.37407833558903]
            ]
        }
        },
        {
        "type": "Feature",
        "properties": {
            "name": "Emory University"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
            [33.95614684001508, -83.98787794315467],
            [33.799848514755695, -84.31886997045254]
            ]
        }
        }
    ]
};

geojsonLineFeatures.features.forEach(function (feature) {
var coordinates = feature.geometry.coordinates;
var name = feature.properties.name;
var popupContent = 'Distance from family house to: ' + name;
var polyline = L.polyline(coordinates, { color: 'blue', weight: 3 }).bindPopup(popupContent);
lineFeatures.addLayer(polyline);
});

// Create a control for the line features with a toggle option
var overlays = {
"Line from Grandma's house to school": lineFeatures,
"County Boundaries": countyBoundaries,
"Cafes/Restaurants": cafeLayer
};

// Add the control to the map
L.control.layers(null, overlays).addTo(map);

// Function to filter cafes based on rating
function filterCafes(rating) {
    cafeLayer.eachLayer(function (layer) {
        var cafeRating = layer.feature.properties.rating;
        if (cafeRating >= rating) {
            layer.setStyle({ fillOpacity: 0.8, color: '#000' }); // Show cafes with rating >= slider value
        } else {
            layer.setStyle({ fillOpacity: 0, color: 'none' }); // Hide cafes with rating < slider value
        }
    });
}

// Create a custom control for the rating slider
var ratingControl = L.control({ position: 'bottomleft' });

ratingControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'slider-control'); // Create a container div
    div.innerHTML = '<rating>Rating Slider:</rating>' +
                    '<input type="range" id="ratingSlider" min="0" max="5" step="0.1" value="0">' +
                    '<span id="currentRating">0</span>';

    L.DomEvent.disableClickPropagation(div);

    // Add an event listener to the slider
    var ratingSlider = div.querySelector('#ratingSlider');
    var currentRatingDisplay = div.querySelector('#currentRating');

    ratingSlider.addEventListener('input', function () {
        // Current slider value
        var selectedRating = parseFloat(ratingSlider.value);

        // Update rating display
        currentRatingDisplay.textContent = selectedRating.toFixed(1); // Show one decimal place

        // Filter 
        cafeLayer.eachLayer(function (layer) {
            var feature = layer.feature;
            var rating = feature.properties.rating;

            // Show/hide the marker based on the rating
            if (rating >= selectedRating) {
                layer.setStyle({ opacity: 1, fillOpacity: 0.8 });
                if (!layer.getPopup()) {
                    // Create the popup dynamically because it wouldn't show up again for some reason
                    layer.bindPopup('<strong>' + feature.properties.name + '</strong>' +
                                    '<br> Rating: ' + feature.properties.rating +
                                    '<br> # of Reviews: ' + feature.properties.reviews +
                                    '<br> Location: ' + feature.properties.city + ', ' + feature.properties.state +
                                    '<br> Address: ' + feature.properties.address + ', ' + feature.properties.postcode);
                }
            } else {
                layer.setStyle({ opacity: 0, fillOpacity: 0 });
                if (layer.getPopup()) {
                    // Remove the popup
                    layer.unbindPopup();
                }
            }
        });
    });

    return div;
};

// Add the control to the map
ratingControl.addTo(map);

// Legend
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend'); // Create a container div
    var labels = ['High Rating (4.5+)', 'Medium Rating (3.0+)', 'Low Rating (>3.0)']; // Customize the labels

    div.innerHTML = '<strong>Yelp Rating</strong><br>'

    for (var i = 0; i < labels.length; i++) {
        div.innerHTML += '<div class="legend-box" style="background-color:' + getColor(i) + '"></div>' +
                        '<span>' + labels[i] + '</span><br>';
    }

    return div;
};

// Add the legend to the map
legend.addTo(map);

function getColor(index) {
    var colors = ['blue', 'yellow', 'red'];
    return colors[index];
}