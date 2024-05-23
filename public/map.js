// Fetch the Mapbox access token from the server
fetch('/.netlify/functions/get-mapbox-token')
  .then(response => response.json())
  .then(data => {
    if (!data.accessToken) {
      throw new Error("Mapbox token not found");
    }
    mapboxgl.accessToken = data.accessToken;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/rqi7/clw9wmcke00pv01nx2p9pgguf',
      center: [-79.34504, 43.81753],
      zoom: 13,
      scrollZoom: false
    });

    // Load data
    const stores = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": { "type": "Point", "coordinates": [-79.34504, 43.81753] },
          "properties": {
            "address": "178 Torbay Rd",
            "city": "Markham, ON",
            "phone": "437-324-2222",
            "phoneFormatted": "(437) 324-2222"
          }
        }
        // Add more locations as needed
      ]
    };

    /* Assign a unique ID to each store */
    stores.features.forEach(function (store, i) {
      store.properties.id = i;
    });

    map.on('load', () => {
      /* Add the data to your map as a layer */
      map.addLayer({
        id: 'locations',
        type: 'circle',
        /* Add a GeoJSON source containing place coordinates and information. */
        source: {
          type: 'geojson',
          data: stores
        }
      });
      buildLocationList(stores);
    });

    // Add markers to map
    stores.features.forEach(function(marker) {
      new mapboxgl.Marker()
        .setLngLat(marker.geometry.coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h3>${marker.properties.address}</h3><p>${marker.properties.city}</p>`))
        .addTo(map);
    });

    // Handle when a location circle on the map is clicked
    map.on('click', (event) => {
      /* Determine if a feature in the "locations" layer exists at that point. */
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['locations']
      });

      /* If it does not exist, return */
      if (!features.length) return;

      const clickedPoint = features[0];

      /* Fly to the point */
      flyToStore(clickedPoint);

      /* Close all other popups and display popup for clicked store */
      createPopUp(clickedPoint);

      /* Highlight listing in sidebar (and remove highlight for all other listings) */
      const activeItem = document.getElementsByClassName('active');
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      const listing = document.getElementById(`listing-${clickedPoint.properties.id}`);
      listing.classList.add('active');
    });

    // Build listing
    function buildLocationList(stores) {
      for (const store of stores.features) {
        /* Add a new listing section to the sidebar. */
        const listings = document.getElementById('listings');
        const listing = listings.appendChild(document.createElement('div'));
        /* Assign a unique `id` to the listing. */
        listing.id = `listing-${store.properties.id}`;
        /* Assign the `item` class to each listing for styling. */
        listing.className = 'item';

        /* Add the link to the individual listing created above. */
        const link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.id = `link-${store.properties.id}`;
        link.innerHTML = `${store.properties.address}`;

        /* Add details to the individual listing. */
        const details = listing.appendChild(document.createElement('div'));
        details.innerHTML = `${store.properties.city}`;
        if (store.properties.phone) {
          details.innerHTML += ` &middot; ${store.properties.phoneFormatted}`;
        }
        if (store.properties.distance) {
          const roundedDistance = Math.round(store.properties.distance * 100) / 100;
          details.innerHTML += `<div><strong>${roundedDistance} miles away</strong></div>`;
        }

        // Handle when a user clicks a link in the sidebar
        link.addEventListener('click', function () {
          for (const feature of stores.features) {
            if (this.id === `link-${feature.properties.id}`) {
              flyToStore(feature);
              createPopUp(feature);
            }
          }
          const activeItem = document.getElementsByClassName('active');
          if (activeItem[0]) {
            activeItem[0].classList.remove('active');
          }
          this.parentNode.classList.add('active');
        });
      }
    }

    // Fly to store
    function flyToStore(currentFeature) {
      map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 15
      });
    }

    // Create popup
    function createPopUp(currentFeature) {
      const popUps = document.getElementsByClassName('mapboxgl-popup');
      /** Check if there is already a popup on the map and if so, remove it */
      if (popUps[0]) popUps[0].remove();

      const popup = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(`<h3>Lucky 5 Global</h3><h4>${currentFeature.properties.address}</h4>`)
        .addTo(map);
    }
  })
  .catch(error => console.error('Error loading Mapbox token:', error));
