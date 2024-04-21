let markers = [];


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
}

function filterMarkersByMonth() {
    console.log('Filtering markers by month');
    let checkboxes = document.querySelectorAll('.month-checkbox');
    let checkedMonths = Array.from(checkboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

    markers.forEach(function(marker) {
        let markerDate = new Date(marker.get('inferred_interview_date'));
        let markerMonth = markerDate.getMonth().toString();
        let isVisible = checkedMonths.includes(markerMonth);
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
                    visible: true // Initially show all markers
                });

                marker.set('inferred_interview_date', location.inferred_interview_date);
                marker.set('image_filename', location.image_filename);

                marker.addListener('click', function() {
                    showLocationInfo(marker.get('title'), marker.get('inferred_interview_date'));
                    showImageForMarker(marker.get('image_filename'));
                });

                markers.push(marker);
            });
        })
        .catch(error => console.error('Error fetching JSON:', error));
}

function showLocationInfo(address, date) {
    var content =   '<h3>Inferred information</h3>' + 
                    '<p>The following info has been extracted from the image ...</p>' +
                    '<p><b>Address:</b><br>' + address + '<br><br>' +
                    '<b>Interview date:</b><br>' + date + '</p>';
    
    document.getElementById('image-info').innerHTML = content;
}

function showImageForMarker(imageFilename) {
    var imageElement = document.getElementById('selected-image');
    var imagePlaceholder = document.getElementById('image-placeholder');

    if (imageFilename) {
        imageElement.src = 'prestimages/' + imageFilename;
        imageElement.style.display = 'block';
        imagePlaceholder.style.display = 'none';
    } else {
        imageElement.style.display = 'none';
        imagePlaceholder.style.display = 'block';
    }
}


window.initMap = initMap;

// Here so it waits for DOM to be loaded first
document.addEventListener('DOMContentLoaded', function() {
    addMonthCheckboxes();
    document.querySelectorAll('.month-checkbox').forEach(function(checkbox) {
        checkbox.addEventListener('change', filterMarkersByMonth);
    });
});