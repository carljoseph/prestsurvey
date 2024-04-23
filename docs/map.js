import Config from './config.js';
let map;
let markers = [];
let interviewers = new Set();


export function loadGoogleMapsApi(callbackName) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Config.apiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

export function initMap() {
    const startLatLng = { lat: -37.7430, lng: 144.9665 };
    const mapOptions = { zoom: 14, center: startLatLng };
    const map = new google.maps.Map(document.getElementById('map'), mapOptions);

    fetch('data/validated_addresses.json')
        .then(response => response.json())
        .then(locations => {
            markers = locations.map(location => {
                const marker = new google.maps.Marker({
                    position: new google.maps.LatLng(location.geocode_latitude, location.geocode_longitude),
                    map: map,
                    title: location.inferred_address,
                    icon: createMarkerIcon('blue'),
                    visible: true
                });

                marker.set('inferred_interview_date', location.inferred_interview_date);
                marker.set('image_filename', location.filename);
                marker.set('archive_identifier', location.archive_identifier);
                marker.set('archive_page_no', location.archive_page_no);
                marker.set('interviewer', location.interviewer);

                marker.addListener('click', function() {
                    updateSelectedMarker(marker);
                    showLocationInfo(marker);
                    showImageForMarker(marker.get('image_filename'));
                    updateUrl(marker);
                });

                return marker;
            });

            checkUrlForMarker();
        })
        .catch(error => console.error('Error fetching JSON:', error));
}

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

function showLocationInfo(marker) {
    const title = marker.get('title');
    const inferred_interview_date = marker.get('inferred_interview_date');
    const archive_identifier = marker.get('archive_identifier');
    const archive_page_no = marker.get('archive_page_no');
    const interviewer = marker.get('interviewer');

    const content = `
        <h3>Inferred information</h3>
        <p>${title}</p>
        <p>Interviewed by ${interviewer || 'Unknown'} on ${inferred_interview_date || 'Unknown'}</p>
        <p><b>Archive identifier:</b><br>${archive_identifier} (Page ${archive_page_no})</p>
    `;
    document.getElementById('image-info').innerHTML = content;
}

function showImageForMarker(imageFilename) {
    const imageElement = document.getElementById('selected-image');
    const imagePlaceholder = document.getElementById('image-placeholder');
    imageElement.style.display = imageFilename ? 'block' : 'none';
    imagePlaceholder.style.display = imageFilename ? 'none' : 'block';
    imageElement.src = imageFilename ? `images/${imageFilename}` : '';
}

function updateUrl(marker) {
    const uniqueId = `${marker.get('archive_identifier')}-${marker.get('archive_page_no')}`;
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?id=${encodeURIComponent(uniqueId)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

function checkUrlForMarker() {
    const urlParams = new URLSearchParams(window.location.search);
    const markerId = urlParams.get('id');
    if (markerId) {
        const marker = markers.find(marker => {
            const uniqueId = `${marker.get('archive_identifier')}-${marker.get('archive_page_no')}`;
            return uniqueId === markerId;
        });
        if (marker) {
            google.maps.event.trigger(marker, 'click');
        }
    }
}

function updateSelectedMarker(marker) {
    if (selectedMarker) {
        selectedMarker.setIcon(createMarkerIcon('blue'));
    }
    selectedMarker = marker;
    marker.setIcon(createMarkerIcon('red'));
}

// Assign initMap to the window object to make it globally accessible
window.initMap = initMap;

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    loadGoogleMapsApi('initMap');
    addMonthCheckboxes();
    document.querySelectorAll('.month-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', filterMarkersByMonth);
    });
});
