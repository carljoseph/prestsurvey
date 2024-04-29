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
    'Anne Athenstone': '#808080',
    'B. Buston': '#808080',
    'B. Wishart': '#808080',
    'Betty Bate': '#808080',
    'Deborah Newton': '#808080',
    'E. Hoberts': '#808080',
    'Fay Jackson': '#808080',
    'Joyce Raymond': '#808080',
    'Lesley Gleeson': '#808080',
    'M. Williams': '#808080',
    'Unsigned': '#808080',
  };
  
  const interviewerOpacities = {
    'Pat Counihan': 1,
    'M. Warnecke': 1,
  };


  function getColorForInterviewer(interviewer) {
    return interviewerColors[interviewer] || '#808080';
  }

  function getOpacityForInterviewer(interviewer) {
    return interviewerOpacities[interviewer] || 0.5;
  }

  function addMarkers(locations) {
    locations.forEach((location) => {
      const color = getColorForInterviewer(location.interviewer);
      const opacity = getOpacityForInterviewer(location.interviewer);
      const marker = new google.maps.Marker({
        position: { lat: location.geocode_latitude, lng: location.geocode_longitude },
        map: map,
        title: location.inferred_address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: opacity,
          strokeColor: "white",
          strokeOpacity: opacity,
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