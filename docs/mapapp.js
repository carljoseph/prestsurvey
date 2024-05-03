import Config from "./config.js";

class MapApp {
  constructor() {
    this.map = null;
    this.markers = [];
    this.interviewers = new Set();
    this.isAnimationPlaying = false;
    this.currentDateIndex = 0;
    this.datesIn1942 = this.generateDatesForYear(1942);
    this.datesWithMarkers = [];
    this.selectedInterviewer = "all";
    this.animationInterval = null;
    this.animationTimeoutWithMarkers = 700;
    this.animationTimeoutWithoutMarkers = 20;
    this.handleDOMEvents();
    this.loadGoogleMapsApi();
  }

  loadGoogleMapsApi() {
    window.initMap = this.initMap.bind(this);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Config.apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  initMap() {
    const mapOptions = {
      zoom: 14,
      center: { lat: -37.743, lng: 144.9665 },
    };
    this.map = new google.maps.Map(document.getElementById("map"), mapOptions);
    this.loadMarkers();
  }

  loadMarkers() {
    fetch("data/validated_addresses.json")
      .then((response) => response.json())
      .then(this.addMarkersFromData.bind(this))
      .catch((error) => console.error("Failed to load markers:", error));
  }

  addMarkersFromData(data) {
    data.forEach((location) => {
      if (location.interviewer) {
        this.interviewers.add(location.interviewer);
        this.addMarker(location);
      } else {
        console.log("Missing interviewer in location:", location);
      }
    });
    this.populateInterviewerDropdown();
  }

  populateInterviewerDropdown() {
    const interviewerSelect = document.getElementById("interviewer-select");
    interviewerSelect.innerHTML = "";

    const showAllOption = document.createElement("option");
    showAllOption.value = "all";
    showAllOption.textContent = "Show all";
    showAllOption.selected = true;
    interviewerSelect.appendChild(showAllOption);

    this.interviewers.forEach((interviewer) => {
      const option = document.createElement("option");
      option.value = interviewer;
      option.textContent = interviewer;
      interviewerSelect.appendChild(option);
    });

    this.selectedInterviewer = "all";
    this.datesWithMarkers = this.generateDatesWithMarkers(this.markers);
    this.resetAnimation();
    this.displayAllMarkers();

    interviewerSelect.addEventListener("change", (e) => {
      this.selectedInterviewer = e.target.value;
      if (this.selectedInterviewer === "all") {
        this.datesWithMarkers = this.generateDatesWithMarkers(this.markers);
        this.resetAnimation();
        this.displayAllMarkers();
      } else {
        this.datesWithMarkers = this.generateDatesWithMarkers(
          this.markers.filter(
            (marker) => marker.interviewer === this.selectedInterviewer
          )
        );
        this.resetAnimation();
        this.displayMarkersForInterviewer(this.selectedInterviewer);
      }
    });
  }

  handleDOMEvents() {
    document.addEventListener("DOMContentLoaded", () => {
      document
        .getElementById("play-pause")
        .addEventListener("click", this.togglePlayPauseAnimation.bind(this));
      document
        .getElementById("prev-step")
        .addEventListener("click", this.prevStep.bind(this));
      document
        .getElementById("next-step")
        .addEventListener("click", this.nextStep.bind(this));
      document
        .getElementById("reset")
        .addEventListener("click", this.resetAnimation.bind(this));
    });
  }

  addMarker(location) {
    const defaultIcon = this.createMarkerIcon("red");
    const selectedIcon = this.createMarkerIcon("blue");
    const marker = new google.maps.Marker({
      position: {
        lat: location.geocode_latitude,
        lng: location.geocode_longitude,
      },
      map: this.map,
      title: location.inferred_address,
      icon: defaultIcon,
      archive_identifier: location.archive_identifier,
      archive_page_no: location.archive_page_no,
      interviewer: location.interviewer || "Unknown",
      inferred_interview_date: location.inferred_interview_date,
      imageFilename: location.filename,
      date: location.inferred_interview_date,
    });

    google.maps.event.addListener(marker, "click", () => {
      this.resetMarkerIcons();
      marker.setIcon(selectedIcon);
      if (this.selectedMarker) {
        this.selectedMarker.setIcon(defaultIcon);
      }
      this.selectedMarker = marker;
      this.showLocationInfoAndImage(marker);
    });

    this.markers.push(marker);
  }

  resetMarkerIcons() {
    const defaultIcon = this.createMarkerIcon("red");
    this.markers.forEach((marker) => {
      marker.setIcon(defaultIcon);
    });
  }

  showLocationInfoAndImage(marker) {
    const title = marker.title;
    const inferred_interview_date = marker.inferred_interview_date;
    const archive_identifier = marker.archive_identifier;
    const archive_page_no = marker.archive_page_no;
    const interviewer = marker.interviewer;
    const imageFilename = marker.imageFilename;

    const content = `
      <h3>Inferred information</h3>
      <p>${title}</p>
      <p>Interviewed by ${interviewer || "Unknown"}<br>on ${this.formatDateToDisplay(inferred_interview_date) || "Unknown"}</p>
      <p><b>Archive identifier:</b><br>${archive_identifier}<br>(Page ${archive_page_no})</p>
    `;
    document.getElementById("image-info").innerHTML = content;

    const imageElement = document.getElementById("selected-image");
    const imagePlaceholder = document.getElementById("image-placeholder");
    imageElement.style.display = imageFilename ? "block" : "none";
    imagePlaceholder.style.display = imageFilename ? "none" : "block";
    imageElement.src = imageFilename ? `images/${imageFilename}` : "";
  }

  displayAllMarkers() {
    this.markers.forEach((marker) => marker.setMap(this.map));
  }

  displayMarkersForInterviewer(interviewerName) {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers
      .filter((marker) => marker.interviewer === interviewerName)
      .forEach((marker) => marker.setMap(this.map));
  }

  displayMarkersForDate(date) {
    console.log("Date: ", date);
    this.markers.forEach((marker) => marker.setMap(null));

    const markersForDate = this.getMarkersForDate(date);
    markersForDate.forEach((marker) => marker.setMap(this.map));

    const formattedDate = this.formatDateToDisplay(date);
    const currentDateDisplay = document.getElementById("current-date-display");

    currentDateDisplay.innerHTML =
      markersForDate.length > 0
        ? `Showing:<br>${formattedDate}`
        : `No entries for:<br>${formattedDate}`;
    currentDateDisplay.style.display = "block";

    const timeoutDuration =
      markersForDate.length > 0
        ? this.animationTimeoutWithMarkers
        : this.animationTimeoutWithoutMarkers;

    if (this.isAnimationPlaying) {
      this.currentDateIndex++;
      if (this.currentDateIndex < this.datesIn1942.length) {
        this.animationInterval = setTimeout(
          () =>
            this.displayMarkersForDate(this.datesIn1942[this.currentDateIndex]),
          timeoutDuration
        );
      } else {
        this.pauseAnimation();
        this.currentDateIndex = 0;
      }
    }
  }

  playAnimation() {
    this.isAnimationPlaying = true;
    document.getElementById("play-pause").textContent = "Pause";
    this.displayMarkersForDate(this.datesIn1942[this.currentDateIndex]);
  }

  pauseAnimation() {
    this.isAnimationPlaying = false;
    if (this.animationInterval) {
      clearTimeout(this.animationInterval);
    }
    document.getElementById("play-pause").textContent = "Play";
  }

  togglePlayPauseAnimation() {
    if (this.isAnimationPlaying) {
      this.pauseAnimation();
    } else {
      this.playAnimation();
    }
  }

  resetAnimation() {
    this.pauseAnimation();
    this.currentDateIndex = 0;
    document.getElementById("current-date-display").textContent = "";
    document.getElementById("current-date-display").style.display = "none";
    this.markers.forEach((marker) => marker.setMap(null));
  }

  prevStep() {
    this.pauseAnimation();
    let found = false;
    for (let i = this.currentDateIndex - 1; i >= 0; i--) {
      const date = this.datesIn1942[i];
      const markersForDate = this.getMarkersForDate(date);
      if (this.datesWithMarkers.includes(date) && markersForDate.length > 0) {
        this.currentDateIndex = i;
        found = true;
        break;
      }
    }
    if (found) {
      this.displayMarkersForDate(this.datesIn1942[this.currentDateIndex]);
    }
  }

  nextStep() {
    this.pauseAnimation();
    let found = false;
    for (let i = this.currentDateIndex + 1; i < this.datesIn1942.length; i++) {
      const date = this.datesIn1942[i];
      const markersForDate = this.getMarkersForDate(date);
      if (this.datesWithMarkers.includes(date) && markersForDate.length > 0) {
        this.currentDateIndex = i;
        found = true;
        break;
      }
    }
    if (found) {
      this.displayMarkersForDate(this.datesIn1942[this.currentDateIndex]);
    }
  }

  createMarkerIcon(color) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "white",
      strokeWeight: 1,
      scale: 10,
    };
  }

  formatDateToDisplay(dateString) {
    const dateOptions = { day: "numeric", month: "long", year: "numeric" };
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", dateOptions);
  }

  generateDatesForYear(year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    const dates = [];
    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  }

  generateDatesWithMarkers(filteredMarkers) {
    const dates = filteredMarkers.map((marker) => marker.date);
    return [...new Set(dates)].sort();
  }

  getMarkersForDate(date) {
    if (this.selectedInterviewer === "all") {
      return this.markers.filter((marker) => marker.date === date);
    } else {
      return this.markers.filter(
        (marker) =>
          marker.interviewer === this.selectedInterviewer &&
          marker.date === date
      );
    }
  }
}

window.mapApp = new MapApp();
