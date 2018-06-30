import { html, render } from 'https://unpkg.com/lit-html@0.7.1/lib/lit-extended.js';

var StartUpMap = function() {
    var me = this;
    this.mapBoxToken = 'pk.eyJ1IjoibWFudWVsYjg2IiwiYSI6ImNqaXNydnhoZjIwYW4zcHA4cjV1OTJlbWUifQ.dvyaW4atK652Sor1113oDg';
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
            me.map.flyTo({ center: oStartUp.geometry.coordinates });
            let oStartUpInfo = document.getElementById("startup-info");
            oStartUpInfo.style.width = oStartUp.properties.width;
            oStartUpInfo.style.height = oStartUp.properties.width;
            render(me.fnStartUpInfoTemplate(oStartUp.properties), oStartUpInfo);
        });
    } else {
        let oBaseTemplate = () => html `<h1 class="handwritten">Start Up Map Koblenz</h1><p>Click on the rockets to see the Start Ups</p><p>Click on the stars to see a supporting company.</p>`;
        render(oBaseTemplate(), document.getElementById("startup-info"));
    }
};
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
    // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
    this.map.on('click', 'startups', function(e) {
        window.location.hash = encodeURIComponent(e.features[0].properties.name);
    });

    // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
    this.map.on('mouseenter', 'startups', function() {
        me.map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    this.map.on('mouseleave', 'startups', function() {
        me.map.getCanvas().style.cursor = '';
    });

    this.loadStartUpsLayer();
};
StartUpMap.prototype.loadStartUpsLayer = function() {
    var me = this;
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

document.addEventListener("DOMContentLoaded", function(event) {
    new StartUpMap();
});