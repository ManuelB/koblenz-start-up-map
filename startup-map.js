import { html, render } from 'https://unpkg.com/lit-html@0.7.1/lib/lit-extended.js';

var StartUpMap = function() {
    var me = this;
    this.mapBoxToken = 'pk.eyJ1IjoibWFudWVsYjg2IiwiYSI6ImNqaXNydnhoZjIwYW4zcHA4cjV1OTJlbWUifQ.dvyaW4atK652Sor1113oDg';
    //curl -v "https://graph.facebook.com/oauth/access_token?client_id=596459477406669&client_secret=[app-secret]&grant_type=client_credentials"
    // App Access Token
    this.facebookAccessToken = "596459477406669|fLY1Ckxs-uWttk-RnBOmKJdiiIs";

    var fnResolve;
    this.pStartupsLoaded = new Promise(function(resolve) {
        fnResolve = resolve;
    });
    this.fnResolve = fnResolve;
    this.fnStartUpInfoTemplate = (startup) => html `<img src="${startup.logo}" class="logo" alt="Logo of ${startup.name}" /><br />
		<h1>${startup.name}</h1>
		<a href="${startup.website}">${startup.website}</a><br />
		<a href="tel:${startup.phone}">${startup.phone}</a><br />
		<a href="mailto:${startup.email}">${startup.email}</a><br />
		<address>
		${startup.address}<br />
		${startup.zipcode} ${startup.city}<br />
		</address>
		<p>Services: ${startup.services}</p>
		<h2>Personen</h2>
		<p class="person"><img src="${startup.personImg}" class="person-img" alt="Image of ${startup.person}" /> ${startup.person}<p>`;

    window.addEventListener("hashchange", function() { me.fnHashChange(); }, false);
    this.fnHashChange();
    this.initMapBox();
};

StartUpMap.prototype.fnHashChange = function() {
    var me = this;
    let sHash = decodeURIComponent(window.location.hash).substring(1);
    if (sHash) {
        try {
            gtag('event', 'startup-focused', {
                'event_label': sHash,
                'event_category': 'map'
            });
        } catch (e) { console.log(e); }
        this.pStartupsLoaded.then(function(oStartUps) {
            let oStartUp = oStartUps.features.filter(o => o.properties.name == sHash)[0];
            if (oStartUp) {
                me.map.flyTo({ center: oStartUp.geometry.coordinates });
                let oStartUpInfo = document.getElementById("startup-info");
                oStartUpInfo.style.width = oStartUp.properties.width;
                oStartUpInfo.style.height = oStartUp.properties.width;
                render(me.fnStartUpInfoTemplate(oStartUp.properties), oStartUpInfo);
            } else {
                me.showStartContent();
                console.log("Could not find Start Up with name: " + sHash);
            }
        });
    } else {
        this.showStartContent();
    }
};
StartUpMap.prototype.showStartContent = function() {
    let oBaseTemplate = () => html `<h1 class="handwritten">Start Up Map Koblenz</h1><p>Click on the rockets to see the Start Ups</p><p>Click on the stars to see a supporting company.</p><p>Click on the circles to see an event.</p>`;
    render(oBaseTemplate(), document.getElementById("startup-info"));
}
StartUpMap.prototype.initMapBox = function() {
    mapboxgl.accessToken = this.mapBoxToken;
    this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v9',
        center: [7.589907, 50.360023],
        zoom: 10
    });
    var me = this;
    this.map.on('load', function() {
        me.onMapLoad();
    });
};
StartUpMap.prototype.onMapLoad = function() {
    var me = this;

    this.loadStartUpsLayer();
    this.loadEventLayer();
};
StartUpMap.prototype.loadStartUpsLayer = function() {
    var me = this;

    this.addEventsToLayer("startups", function(e) {
        window.location.hash = encodeURIComponent(e.features[0].properties.name);
    });

    fetch("startups.json").then(function(response) {
        return response.json();
    }).then(function(oStartUps) {
        me.fnResolve(oStartUps);
        me.map.addLayer({
            "id": "startups",
            "type": "symbol",
            "source": {
                "type": "geojson",
                "data": oStartUps
            },
            "layout": {
                "icon-image": "{marker}-15"
            }
        });
    });
};
StartUpMap.prototype.addEventsToLayer = function(sLayerName, onClick) {
    var me = this;
    // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
    this.map.on('click', sLayerName, onClick);

    // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
    this.map.on('mouseenter', sLayerName, function() {
        me.map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    this.map.on('mouseleave', sLayerName, function() {
        me.map.getCanvas().style.cursor = '';
    });
};
StartUpMap.prototype.loadEventLayer = function() {
    var me = this;

    this.addEventsToLayer("events", function(e) {
        var oFeatureProperties = e.features[0].properties;
        var markerHeight = 50,
            markerRadius = 10,
            linearOffset = 25;
        var popupOffsets = {
            'top': [0, 0],
            'top-left': [0, 0],
            'top-right': [0, 0],
            'bottom': [0, -markerHeight],
            'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'left': [markerRadius, (markerHeight - markerRadius) * -1],
            'right': [-markerRadius, (markerHeight - markerRadius) * -1]
        };
        var popup = new mapboxgl.Popup({ offset: popupOffsets, className: 'popup-class' })
            .setLngLat(e.lngLat)
            .setHTML("<h1>" + oFeatureProperties.name +
                "</h1>" +
                "<a href=\"https://www.facebook.com/events/" + oFeatureProperties.id + "\">Facebook Event</a>" +
                "<p>" + oFeatureProperties.description +
                "<br />Start: " + oFeatureProperties.start_time +
                "<br />Ende: " + oFeatureProperties.end_time + "</p>" +
                "<address>" + oFeatureProperties.place_name + "<br />" +
                oFeatureProperties.place_location_street + "<br/>" +
                oFeatureProperties.place_location_zip + " " + oFeatureProperties.place_location_city + "<br/><br/></address>")
            .addTo(me.map);
    });

    fetch("facebook-group-or-page-ids.json").then(function(response) {
        return response.json();
    }).then(function(aFacebookPageEventIds) {
        var aPromises = aFacebookPageEventIds.map(function(aFacebookId) {
            var pPromise = new Promise(function(resolve, reject) {
                FB.api(
                    "/" + aFacebookId + "/events", { access_token: me.facebookAccessToken },
                    function(response) {
                        if (response && !response.error) {
                            resolve(response);
                        } else if (response) {
                            console.log(response.error);
                            resolve({ "data": [] });
                        }
                    }
                );
            });
            return pPromise;
        });
        if (window.location.hash.match(/.*AddDebugEvent.*/)) {
            aPromises.push(fetch("test-data/FaceBookEvent.json").then(function(response) {
                return response.json();
            }));
        }
        return Promise.all(aPromises);
    }).then(function(aFacebookPageEvents) {
        // console.log(aFacebookPageEvents);

        var aEvents = [];
        aFacebookPageEvents.forEach(function(oItem) {
            aEvents.push.apply(aEvents, oItem.data);
        });

        var aEventFeatures = aEvents.map(function(oEvent) {
            var oProperties = {
                "name": oEvent.name,
                "id": oEvent.id,
                "marker": "circle",
                "description": oEvent.description,
                "start_time": oEvent.start_time,
                "end_time": oEvent.end_time,
            };
            var latitude = 0;
            var longitude = 0;
            if ("place" in oEvent) {
                oProperties["place_name"] = oEvent.place.name;
                oProperties["place_location_city"] = oEvent.place.location.city;
                oProperties["place_location_country"] = oEvent.place.location.country;
                oProperties["place_location_street"] = oEvent.place.location.street;
                oProperties["place_location_zip"] = oEvent.place.location.zip;
                oProperties["place_id"] = oEvent.place.id;
                latitude = oEvent.place.location.latitude;
                longitude = oEvent.place.location.longitude;
            }
            return {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "properties": oProperties
            };
        });

        me.map.addLayer({
            "id": "events",
            "type": "symbol",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": aEventFeatures
                }
            },
            "layout": {
                "icon-image": "{marker}-15"
            }
        });
    });
};

document.addEventListener("DOMContentLoaded", function(event) {
    new StartUpMap();
});