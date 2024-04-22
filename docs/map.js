import Config from './config.js';

function loadGoogleMapsApi() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Config.apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}
loadGoogleMapsApi();

let markers = [];
let selectedMarker = null;

function createMarkerIcon(color) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 1,
        scale: 7,
    };
}

function addMonthCheckboxes() {
    const controls = document.getElementById('controls');
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    months.forEach((month, index) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'month-checkbox';
        checkbox.value = index.toString();
        checkbox.checked = true;
        checkbox.addEventListener('change', filterMarkersByMonth);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${month} 1942`));
        controls.appendChild(label);
        controls.appendChild(document.createElement('br'));
    });

    const emptyLabel = document.createElement('label');
    const emptyCheckbox = document.createElement('input');
    emptyCheckbox.type = 'checkbox';
    emptyCheckbox.className = 'month-checkbox';
    emptyCheckbox.value = "empty";
    emptyCheckbox.checked = true;
    emptyCheckbox.addEventListener('change', filterMarkersByMonth);

    emptyLabel.appendChild(emptyCheckbox);
    emptyLabel.appendChild(document.createTextNode(' Empty Dates'));
    controls.appendChild(emptyLabel);
    controls.appendChild(document.createElement('br'));
}

function filterMarkersByMonth() {
    let checkboxes = document.querySelectorAll('.month-checkbox');
    let checkedMonths = Array.from(checkboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

    markers.forEach(function(marker) {
        let markerDate = marker.get('inferred_interview_date');
        let isEmptyDate = !markerDate && checkedMonths.includes("empty");
        let markerMonth = markerDate ? new Date(markerDate).getMonth().toString() : null;
        let isVisible = isEmptyDate || checkedMonths.includes(markerMonth);
        marker.setVisible(isVisible);
    });
}

function initMap() {
    var startLatLng = {lat: -37.7430, lng: 144.9665};
    var mapOptions = {
        zoom: 14,
        center: startLatLng
    };
    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    fetch('data/validated_addresses.json')
        .then(response => response.json())
        .then(locations => {
            locations.forEach(function(location) {
                let marker = new google.maps.Marker({
                    position: new google.maps.LatLng(location.geocode_latitude, location.geocode_longitude),
                    map: map,
                    title: location.inferred_address,
                    icon: createMarkerIcon('blue'), // Default marker color
                    visible: true
                });

                marker.set('inferred_interview_date', location.inferred_interview_date);
                marker.set('image_filename', location.image_filename);
                marker.set('archive_identifier', location.archive_identifier);
                marker.set('archive_page_no', location.archive_page_no);

                marker.addListener('click', function() {
                    if (selectedMarker) {
                        selectedMarker.setIcon(createMarkerIcon('blue'));
                    }
                    selectedMarker = marker;
                    marker.setIcon(createMarkerIcon('red'));

                    showLocationInfo(
                        marker.get('title'),
                        marker.get('inferred_interview_date'),
                        marker.get('archive_identifier'),
                        marker.get('archive_page_no')
                    );
                    showImageForMarker(marker.get('image_filename'));

                    const uniqueId = `${marker.get('archive_identifier')}-${marker.get('archive_page_no')}`;
                    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?id=${encodeURIComponent(uniqueId)}`;
                    window.history.pushState({path: newUrl}, '', newUrl);
                });

                markers.push(marker);
            });

            // If a marker ID is present in the URL, find and trigger click on that marker
            const urlParams = new URLSearchParams(window.location.search);
            const markerId = urlParams.get('id');
            if (markerId) {
                markers.forEach(marker => {
                    const uniqueId = `${marker.get('archive_identifier')}-${marker.get('archive_page_no')}`;
                    if (uniqueId === markerId) {
                        google.maps.event.trigger(marker, 'click');
                    }
                });
            }
        })
        .catch(error => console.error('Error fetching JSON:', error));
}

function showLocationInfo(address, date, archiveIdentifier, archivePageNo) {
    var content = '<h3>Inferred information</h3>' +
                  '<p>The following info has been extracted from the image:</p>' +
                  '<p><b>Address:</b><br>' + address + '</p>' +
                  '<p><b>Interview date:</b><br>' + date + '</p>' +
                  '<p><b>Archive Identifier:</b><br>' + archiveIdentifier + '</p>' +
                  '<p><b>Archive Page Number:</b><br>' + archivePageNo + '</p>';

    document.getElementById('image-info').innerHTML = content;
}

function showImageForMarker(imageFilename) {
    var imageElement = document.getElementById('selected-image');
    var imagePlaceholder = document.getElementById('image-placeholder');

    if (imageFilename) {
        imageElement.src = 'images/' + imageFilename;
        imageElement.style.display = 'block';
        imagePlaceholder.style.display = 'none';
    } else {
        imageElement.style.display = 'none';
        imagePlaceholder.style.display = 'block';
    }
}

window.initMap = initMap;

document.addEventListener('DOMContentLoaded', function() {
    addMonthCheckboxes();
    document.querySelectorAll('.month-checkbox').forEach(function(checkbox) {
        checkbox.addEventListener('change', filterMarkersByMonth);
    });
});