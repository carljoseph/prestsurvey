import Config from './config.js';

let map;
let markers = [];
let interviewers = new Set();
let animationInterval;
let animationTimeoutWithMarkers = 700;
let animationTimeoutWithoutMarkers = 20;
let isAnimationPlaying = false;
let currentDateIndex = 0;
let datesIn1942 = generateDatesForYear(1942);
let datesWithMarkers = [];
let selectedInterviewer = null;

function loadGoogleMapsApi() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Config.apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

function createMap() {
    const mapOptions = {
        zoom: 14,
        center: { lat: -37.7430, lng: 144.9665 },
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function addMarker(location) {
    const icon = createMarkerIcon('red');
    const marker = new google.maps.Marker({
        position: { lat: location.geocode_latitude, lng: location.geocode_longitude },
        map: map,
        title: location.inferred_address,
        icon: icon,
        archive_identifier: location.archive_identifier,
        archive_page_no: location.archive_page_no,
        interviewer: location.interviewer || 'Unknown',
        inferred_interview_date: location.inferred_interview_date,
        imageFilename: location.filename,
        date: location.inferred_interview_date,
    });
    google.maps.event.addListener(marker, 'click', function() {
        showLocationInfoAndImage(this);
    });
    markers.push(marker);
}


function loadMarkers() {
    fetch('data/validated_addresses.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(location => {
                if (location.interviewer) {
                    interviewers.add(location.interviewer);
                    addMarker(location);
                } else {
                    console.log("Missing interviewer in location:", location); 
                }
            });
            populateInterviewerDropdown();
        })
        .catch(error => {
            console.error('Failed to load markers:', error);
            console.error('Error response:', error.response);
        });
}

function populateInterviewerDropdown() {
    const interviewerSelect = document.getElementById('interviewer-select');
    interviewerSelect.innerHTML = '';

    /*
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select interviewer...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    interviewerSelect.appendChild(defaultOption);
    */

    const showAllOption = document.createElement('option');
    showAllOption.value = 'all';
    showAllOption.textContent = 'Show all';
    showAllOption.selected = true;
    interviewerSelect.appendChild(showAllOption);

    interviewers.forEach(interviewer => {
        const option = document.createElement('option');
        option.value = interviewer;
        option.textContent = interviewer;
        interviewerSelect.appendChild(option);
    });

    selectedInterviewer = null;

    interviewerSelect.addEventListener('change', (e) => {
        selectedInterviewer = e.target.value;
        console.log(`Selected interviewer: ${selectedInterviewer}`);
        if (selectedInterviewer === 'all') {
            datesWithMarkers = generateDatesWithMarkers(markers);
            resetAnimation();
            displayAllMarkers();
        } else {
            datesWithMarkers = generateDatesWithMarkers(markers.filter(marker => marker.interviewer === selectedInterviewer));
            resetAnimation();
            displayMarkersForInterviewer(selectedInterviewer);
        }
    });
}

function displayAllMarkers() {
    markers.forEach(marker => marker.setMap(map));
}

function generateDatesWithMarkers(filteredMarkers) {
    const dates = filteredMarkers.map(marker => marker.date);
    return [...new Set(dates)].sort();
}


function displayMarkersForInterviewer(interviewerName) {
    markers.forEach(marker => marker.setMap(null));
    markers.filter(marker => marker.interviewer === interviewerName).forEach(marker => {
        marker.setMap(map);
    });
}

function generateDatesForYear(year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    const dates = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

function createMarkerIcon(color) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 1,
        scale: 10,
    };
}

function formatDateToDisplay(dateString) {
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', dateOptions);
}

function displayMarkersForDate(date) {
    console.log('Date: ', date);
    markers.forEach(marker => marker.setMap(null));

    let markersForDate;
    if (selectedInterviewer === 'all') {
        markersForDate = markers.filter(marker => marker.date === date);
    } else {
        markersForDate = markers.filter(marker =>
            marker.interviewer === selectedInterviewer && marker.date === date
        );
    }

    markersForDate.forEach(marker => marker.setMap(map));

    const formattedDate = formatDateToDisplay(date);
    const currentDateDisplay = document.getElementById('current-date-display');
    currentDateDisplay.innerHTML = markersForDate.length > 0
        ? `Showing:<br>${formattedDate}`
        : `No entries for:<br>${formattedDate}`;

    const timeoutDuration = markersForDate.length > 0 ? animationTimeoutWithMarkers : animationTimeoutWithoutMarkers;

    if (isAnimationPlaying) {
        currentDateIndex++;
        if (currentDateIndex < datesIn1942.length) {
            setTimeout(() => displayMarkersForDate(datesIn1942[currentDateIndex]), timeoutDuration);
        } else {
            pauseAnimation();
            currentDateIndex = 0;
        }
    }
}

function showLocationInfoAndImage(marker) {
    const title = marker.get('title');
    const inferred_interview_date = marker.get('inferred_interview_date');
    const archive_identifier = marker.get('archive_identifier');
    const archive_page_no = marker.get('archive_page_no');
    const interviewer = marker.get('interviewer');
    const imageFilename = marker.imageFilename;

    const content = `
        <h3>Inferred information</h3>
        <p>${title}</p>
        <p>Interviewed by ${interviewer || 'Unknown'} on ${inferred_interview_date || 'Unknown'}</p>
        <p><b>Archive identifier:</b><br>${archive_identifier} (Page ${archive_page_no})</p>
    `;
    document.getElementById('image-info').innerHTML = content;

    const imageElement = document.getElementById('selected-image');
    const imagePlaceholder = document.getElementById('image-placeholder');
    imageElement.style.display = imageFilename ? 'block' : 'none';
    imagePlaceholder.style.display = imageFilename ? 'none' : 'block';
    imageElement.src = imageFilename ? `images/${imageFilename}` : '';

}


function initMap() {
    createMap();
    loadMarkers();
}

function playAnimation() {
    isAnimationPlaying = true;
    document.getElementById('play-pause').textContent = 'Pause';
    displayMarkersForDate(datesIn1942[currentDateIndex]);
}

function pauseAnimation() {
    isAnimationPlaying = false;
    clearTimeout(animationInterval); 
    document.getElementById('play-pause').textContent = 'Play';
}

function togglePlayPauseAnimation() {
    if (isAnimationPlaying) {
        pauseAnimation();
    } else {
        playAnimation();
    }
}

function resetAnimation() {
    pauseAnimation();
    currentDateIndex = 0;
    document.getElementById('current-date-display').textContent = '';
    markers.forEach(marker => marker.setMap(null));
}

function prevStep() {
    pauseAnimation();
    console.log('Stepping to previous date with markers');
    let found = false;
    for (let i = currentDateIndex - 1; i >= 0; i--) {
        const date = datesIn1942[i];
        if (datesWithMarkers.includes(date) && (selectedInterviewer === 'all' || markers.some(marker => 
            marker.date === date && marker.interviewer === selectedInterviewer))) {
            currentDateIndex = i;
            found = true;
            break;
        }
    }
    if (found) {
        displayMarkersForDate(datesIn1942[currentDateIndex]);
    }
}

function nextStep() {
    pauseAnimation();
    console.log('Stepping to next date with markers');
    let found = false;
    for (let i = currentDateIndex + 1; i < datesIn1942.length; i++) {
        const date = datesIn1942[i];
        if (datesWithMarkers.includes(date) && (selectedInterviewer === 'all' || markers.some(marker => 
            marker.date === date && marker.interviewer === selectedInterviewer))) {
            currentDateIndex = i;
            found = true;
            break;
        }
    }
    if (found) {
        displayMarkersForDate(datesIn1942[currentDateIndex]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadGoogleMapsApi();
    document.getElementById('play-pause').addEventListener('click', togglePlayPauseAnimation);
    document.getElementById('prev-step').addEventListener('click', prevStep);
    document.getElementById('next-step').addEventListener('click', nextStep);
    document.getElementById('reset').addEventListener('click', resetAnimation);
});

window.initMap = initMap;