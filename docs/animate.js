// animate.js
import Config from './config.js';

let map;
let markers = [];
let interviewers = new Set();
let animationInterval;
let animationTimeoutWithMarkers = 700; // Timeout for days with markers
let animationTimeoutWithoutMarkers = 20; // Timeout for days without markers

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
    const marker = new google.maps.Marker({
        position: { lat: location.geocode_latitude, lng: location.geocode_longitude },
        map: map,
        title: location.inferred_address,
    });
    // Store additional properties directly on the marker object
    marker.inferred_interview_date = location.inferred_interview_date;
    marker.interviewer = location.interviewer;
    markers.push(marker);
}

function loadMarkers() {
    fetch('data/validated_addresses.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(location => {
                interviewers.add(location.interviewer); // Collect interviewer names
                addMarker(location); // Add marker to the map
            });
            populateInterviewerDropdown(); // Create interviewer controls after loading data
        })
        .catch(error => console.error('Failed to load markers:', error));
}

function populateInterviewerDropdown() {
    const interviewerSelect = document.getElementById('interviewer-select');
    interviewers.forEach(interviewer => {
        const option = document.createElement('option');
        option.value = interviewer;
        option.textContent = interviewer;
        interviewerSelect.appendChild(option);
    });
}

function animateMarkersByInterviewer(interviewer) {
    clearInterval(animationInterval); // Clear any existing animation
    let currentDateIndex = 0;
    const datesIn1942 = generateDatesForYear(1942);
    const currentDateDisplay = document.getElementById('current-date-display');

    function displayMarkersForDate(date) {
        markers.forEach(marker => marker.setMap(null)); // Hide all markers initially
        const markersForDate = markers.filter(marker =>
            marker.interviewer === interviewer && marker.inferred_interview_date === date
        );
        markersForDate.forEach(marker => marker.setMap(map)); // Show markers for the date

        currentDateDisplay.textContent = markersForDate.length > 0 ?
            `Showing entries for: ${date}` : `No entries for: ${date}`;

        currentDateIndex++;
        const nextDate = datesIn1942[currentDateIndex];
        if (nextDate) {
            const timeoutDuration = markersForDate.length > 0 ?
                animationTimeoutWithMarkers : animationTimeoutWithoutMarkers;
            setTimeout(() => displayMarkersForDate(nextDate), timeoutDuration);
        } else {
            currentDateDisplay.textContent = 'Animation completed';
        }
    }

    const firstDate = datesIn1942[currentDateIndex];
    if (firstDate) {
        displayMarkersForDate(firstDate);
    }
}

function generateDatesForYear(year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    const dates = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        dates.push(date.toISOString().split('T')[0]); // Format as 'YYYY-MM-DD'
    }
    return dates;
}

function initMap() {
    createMap();
    loadMarkers();
}


loadGoogleMapsApi();
window.initMap = initMap;
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('show-animation').addEventListener('click', () => {
        const interviewerSelect = document.getElementById('interviewer-select');
        const interviewer = interviewerSelect.value;
        animateMarkersByInterviewer(interviewer);
    });
});

