import { html, render } from 'https://unpkg.com/lit-html@0.7.1/lib/lit-extended.js';

var fnResolve;
const pStartupsLoaded = new Promise(function(resolve) {
    fnResolve = resolve;
});

document.addEventListener("DOMContentLoaded", function(event) {
    let fnStartUpInfoTemplate = (startup) => html `<img src="${startup.logo}" class="logo" alt="Logo of ${startup.name}" /><br />
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

    function fnHashChange() {
        let sHash = decodeURIComponent(window.location.hash).substring(1);
        if (sHash) {
	    try {
		    gtag('event', 'startup-focused', {
			    'event_label': sHash,
			    'event_category': 'map'
		    });
	    } catch(e) { console.log(e); }
            pStartupsLoaded.then(function(oStartUps) {
                let oStartUp = oStartUps.features.filter(o => o.properties.name == sHash)[0];
                map.flyTo({ center: oStartUp.geometry.coordinates });
                let oStartUpInfo = document.getElementById("startup-info");
                oStartUpInfo.style.width = oStartUp.properties.width;
                oStartUpInfo.style.height = oStartUp.properties.width;
                render(fnStartUpInfoTemplate(oStartUp.properties), oStartUpInfo);
            });
        } else {
            let oBaseTemplate = () => html `<h1 class="handwritten">Start Up Map Koblenz</h1><p>Click on the rockets to see the Start Ups</p>`;
            render(oBaseTemplate(), document.getElementById("startup-info"));
        }
    }
    window.addEventListener("hashchange", fnHashChange, false);
    fnHashChange();

    mapboxgl.accessToken = 'pk.eyJ1IjoibWFudWVsYjg2IiwiYSI6ImNqaXNydnhoZjIwYW4zcHA4cjV1OTJlbWUifQ.dvyaW4atK652Sor1113oDg';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v9',
        center: [7.589907, 50.360023],
        zoom: 10
    });
    map.on('load', function() {

        // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
        map.on('click', 'startups', function(e) {
            window.location.hash = encodeURIComponent(e.features[0].properties.name);
        });

        // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
        map.on('mouseenter', 'startups', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'startups', function() {
            map.getCanvas().style.cursor = '';
        });

        fetch("startups.json").then(function(response) {
            return response.json();
        }).then(function(oStartUps) {
            fnResolve(oStartUps);
            map.addLayer({
                "id": "startups",
                "type": "symbol",
                "source": {
                    "type": "geojson",
                    "data": oStartUps
                },
                "layout": {
                    "icon-image": "rocket-15"
                }
            });
        });
    });
});
