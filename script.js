document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = ""; // replace with OpenWeatherMap API key

  /*********************************
   * CLOCK
   *********************************/
  function updateTime() {
    const now = new Date();

    document.getElementById("datetime").innerText = now.toLocaleString();
  }

  setInterval(updateTime, 1000);
  updateTime();

  /*********************************
   * MAP VARIABLES
   *********************************/
  let map;
  let marker;

  /*********************************
   * PAGE LOAD
   *********************************/
  window.onload = () => {
    initMap();

    const lastCity = localStorage.getItem("lastCity");

    if (lastCity) {
      getWeather(lastCity);
    } else {
      getLocationWeather();
    }

    // Search on Enter key
    document.getElementById("cityInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        getWeatherByCity();
      }
    });
  };

  /*********************************
   * INITIALIZE MAP
   *********************************/
  function initMap() {
    // Leaflet library object
    // ID of HTML element where map will appear
    map = L.map("map", {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
    }).setView([20.5937, 78.9629], 4);
    // built-in method provided by the Leaflet.js library.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Click anywhere on map
    map.on("click", (e) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      getWeatherByCoordinates(lat, lon);
    });
  }
  async function getWeatherByCoordinates(lat, lon) {
    try {
      document.getElementById("error").innerText = "";

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Unable to fetch weather");
      }

      const data = await res.json();

      // Update weather card
      displayWeather(data);

      // Save city
      localStorage.setItem("lastCity", data.name);
    } catch (err) {
      document.getElementById("error").innerText = "Unable to fetch weather.";
    }
  }
  /*********************************
   * GET WEATHER USING GPS
   *********************************/
  function getLocationWeather() {
    if (!navigator.geolocation) {
      document.getElementById("error").innerText = "Geolocation not supported.";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

          const res = await fetch(url);
          const data = await res.json();

          displayWeather(data);

          localStorage.setItem("lastCity", data.name);
        } catch (err) {
          console.error(err);
        }
      },
      () => {
        document.getElementById("error").innerText =
          "Unable to access location.";
      },
    );
  }

  /*********************************
   * SEARCH BUTTON
   *********************************/
  function getWeatherByCity() {
    const city = document.getElementById("cityInput").value.trim();

    if (!city) return;

    getWeather(city);
  }

  /*********************************
   * FETCH WEATHER BY CITY
   *********************************/
  async function getWeather(city) {
    try {
      document.getElementById("error").innerText = "";

      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("City not found");
      }

      const data = await res.json();

      localStorage.setItem("lastCity", city);

      displayWeather(data);
    } catch (err) {
      document.getElementById("error").innerText =
        "Invalid city name. Please try again.";

      console.error(err);
    }
  }

  /*********************************
   * DISPLAY WEATHER
   *********************************/
  function displayWeather(data) {
    document.getElementById("cityName").innerText =
      `${data.name}, ${data.sys.country}`;

    document.getElementById("temp").innerText =
      `Temperature: ${data.main.temp} °C`;

    document.getElementById("humidity").innerText =
      `Humidity: ${data.main.humidity}%`;

    document.getElementById("wind").innerText =
      `Wind Speed: ${data.wind.speed} m/s`;

    document.getElementById("condition").innerText =
      `Condition: ${data.weather[0].description}`;

    document.getElementById("weatherIcon").src =
      `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Update map location
    updateMap(data.coord.lat, data.coord.lon, data.name);

    // Update background theme
    setWeatherBackground(data.weather[0].main);
  }

  /*********************************
   * UPDATE MAP
   *********************************/
  function updateMap(lat, lon, city) {
    // Smooth fly animation
    map.flyTo([lat, lon], 12, {
      animate: true,
      duration: 2,
    });

    map.once("moveend", () => {
      map.panBy([300, 0]); // positive = right, negative = left
    });

    // Reuse existing marker
    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.marker([lat, lon]).addTo(map);
    }

    marker.bindPopup(`<b>${city}</b>`).openPopup();
  }

  /*********************************
   * WEATHER BACKGROUND THEMES
   *********************************/
  function setWeatherBackground(condition) {
    let bg = "";

    switch (condition.toLowerCase()) {
      case "clear":
        bg = "linear-gradient(to right, #fceabb, #f8b500)";
        break;

      case "clouds":
        bg = "linear-gradient(to right, #bdc3c7, #2c3e50)";
        break;

      case "rain":
        bg = "linear-gradient(to right, #4b79a1, #283e51)";
        break;

      case "thunderstorm":
        bg = "linear-gradient(to right, #141e30, #243b55)";
        break;

      case "snow":
        bg = "linear-gradient(to right, #e6dada, #274046)";
        break;

      case "mist":
      case "fog":
      case "haze":
        bg = "linear-gradient(to right, #757f9a, #d7dde8)";
        break;

      default:
        bg = "linear-gradient(to right, #74ebd5, #acb6e5)";
    }

    document.body.style.background = bg;
  }

  let weatherLayer;
  function addWeatherOverlay(type = "clouds") {
    if (weatherLayer) {
      map.removeLayer(weatherLayer);
    }

    weatherLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${type}/{z}/{x}/{y}.png?appid=${API_KEY}`,
      {
        opacity: 0.6,
      },
    );

    weatherLayer.addTo(map);
  }

  const weatherType = data.weather[0].main.toLowerCase();

  if (weatherType.includes("rain") || weatherType.includes("drizzle")) {
    addWeatherOverlay("precipitation_new");
  } else if (weatherType.includes("cloud")) {
    addWeatherOverlay("clouds_new");
  } else {
    if (weatherLayer) {
      map.removeLayer(weatherLayer);
    }
  }
});
