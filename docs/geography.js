import Config from './config.js';

function initMap() {

  const mapOptions = {
    zoom: 14,
    center: new google.maps.LatLng(-37.7442151, 144.9706273)
  };

  const map = new google.maps.Map(document.getElementById('map'), mapOptions);

  const interviewerColors = {
    'Pat Counihan': '#0000FF',
    'M. Warnecke': '#FF0000',
    'J. Grant': '#008000',
    'Rosemary Francis': '#800080',
    'Rhoda Levy': '#A52A2A',

    'Anne Athenstone': '#808080', // Green
    'B. Buston': '#808080', // Blue
    'B. Wishart': '#808080', // Yellow
    'Betty Bate': '#808080', // Magenta
    'Deborah Newton': '#808080', // Cyan
    'E. Hoberts': '#808080', // Maroon
    'Fay Jackson': '#808080', // Olive
    'Joyce Raymond': '#808080', // Purple
    'Lesley Gleeson': '#808080', // Teal
    'M. Williams': '#808080', // Navy
    'Unsigned': '#808080', // Gray
  };
  

  function getColorForInterviewer(interviewer) {
    return interviewerColors[interviewer] || '#000000';
  }

  function addMarkers(locations) {
    locations.forEach((location) => {
      const color = getColorForInterviewer(location.interviewer);
      const marker = new google.maps.Marker({
        position: { lat: location.geocode_latitude, lng: location.geocode_longitude },
        map: map,
        title: location.inferred_address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "white",
          strokeOpacity: 1,
          strokeWeight: 1,
          scale: 10
        }
      });
    });
  }

  fetch('./data/validated_addresses.json')
    .then(response => response.json())
    .then(data => {
      addMarkers(data);
    })
    .catch(error => console.error('Error loading the locations:', error));
}

window.initMap = initMap;

const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${Config.apiKey}&callback=initMap`;
script.async = true;
script.defer = true;
document.head.appendChild(script);