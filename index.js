// https://openweathermap.org/api/weather-conditions

const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const locationBtn = document.querySelector(".locationBtn");
const card = document.querySelector(".card");
const loader = document.querySelector(".loader");
const recentTitle = document.querySelector(".recentTitle");
const recentList = document.querySelector(".recentList");

const apiKey = "982a1370d6b25ef06440a66470df2c09";

const RECENT_KEY = "recentCities";
const MAX_RECENT = 5;

// ----------------------------------------
// Form submit: search by city name
// ----------------------------------------
weatherForm.addEventListener("submit", async event => {

    event.preventDefault();

    const city = cityInput.value.trim();

    if(city){
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        await loadWeather(apiUrl);
    }
    else displayError("Please enter a city");

});

// ----------------------------------------
// "Use my location" button
// ----------------------------------------
locationBtn.addEventListener("click", () => {

    if(!navigator.geolocation){
        displayError("Geolocation is not supported by your browser");
        return;
    }
    
    showLoader();

    navigator.geolocation.getCurrentPosition(async position => {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        await loadWeather(apiUrl);

    }, () => {
        hideLoader();
        displayError("Unable to retrieve your location");
    });

});

// ----------------------------------------
// Shared function to fetch + display weather
// ----------------------------------------
async function loadWeather(apiUrl){

    showLoader();

    try{
        const weatherData = await getWeatherData(apiUrl);
        displayWeatherInfo(weatherData);

        // Save the city name returned by the API (works for geolocation too)
        saveRecentCity(weatherData.name);
    }
    catch(error){
        console.error(error);
        displayError(error.message);
    }
    finally{
        hideLoader();
    }
}

async function getWeatherData(apiUrl){

    const response = await fetch(apiUrl);

    if(!response.ok){
        if(response.status === 404) throw new Error("City not found. Check the spelling and try again.");
        if(response.status === 401) throw new Error("Invalid API key.");
        throw new Error("Could not fetch weather data");
    }

    return response.json();
}

// ----------------------------------------
// Display weather card
// ----------------------------------------
function displayWeatherInfo(data){

    const {name: city,
           main: {temp, humidity, feels_like},
           weather: [{description, id}],
           wind: {speed}} = data;

    card.textContent = "";
    card.style.display = "flex";

    const cityDisplay = document.createElement("h1");
    const dateDisplay = document.createElement("p");
    const tempDisplay = document.createElement("p");
    const feelsLikeDisplay = document.createElement("p");
    const humidityDisplay = document.createElement("p");
    const windDisplay = document.createElement("p");
    const descDisplay = document.createElement("p");
    const weatherEmoji = document.createElement("p");

    cityDisplay.textContent = city;
    dateDisplay.textContent = getFormattedDate();
    tempDisplay.textContent = `${(temp - 273.15).toFixed(1)}°C`;
    feelsLikeDisplay.textContent = `Feels like: ${(feels_like - 273.15).toFixed(1)}°C`;
    humidityDisplay.textContent = `Humidity: ${humidity}%`;
    windDisplay.textContent = `Wind: ${(speed * 3.6).toFixed(1)} km/h`;
    descDisplay.textContent = description;
    weatherEmoji.textContent = getWeatherEmoji(id);

    cityDisplay.classList.add("cityDisplay");
    dateDisplay.classList.add("dateDisplay");
    tempDisplay.classList.add("tempDisplay");
    feelsLikeDisplay.classList.add("feelsLikeDisplay");
    humidityDisplay.classList.add("humidityDisplay");
    windDisplay.classList.add("windDisplay");
    descDisplay.classList.add("descDisplay");
    weatherEmoji.classList.add("weatherEmoji");

    card.appendChild(cityDisplay);
    card.appendChild(dateDisplay);
    card.appendChild(tempDisplay);
    card.appendChild(feelsLikeDisplay);
    card.appendChild(humidityDisplay);
    card.appendChild(windDisplay);
    card.appendChild(descDisplay);
    card.appendChild(weatherEmoji);
}

// ----------------------------------------
// Weather emoji based on condition code
// ----------------------------------------
function getWeatherEmoji(weatherId){
    switch(true){
        case (weatherId >= 200 && weatherId < 300):
            return "⛈";
        case(weatherId >= 300 && weatherId < 400):
            return "🌧";
        case(weatherId >= 500 && weatherId < 600):
            return "🌧";
        case(weatherId >= 600 && weatherId < 700):
            return "❄";
        case(weatherId >= 700 && weatherId < 800):
            return "🌫";
        case(weatherId === 800):
            return "☀";
        case(weatherId >= 801 && weatherId < 810):
            return "☁";
        default:
            return "❓";
    }
}

// ----------------------------------------
// Date formatting (today's date)
// ----------------------------------------
function getFormattedDate(){
    const today = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return today.toLocaleDateString("en-IN", options);
}

// ----------------------------------------
// Error display
// ----------------------------------------
function displayError(message){
    const errorDisplay = document.createElement("p");
    errorDisplay.textContent = message;
    errorDisplay.classList.add("errorDisplay");

    card.textContent = "";
    card.style.display = "flex";
    card.appendChild(errorDisplay);
}

// ----------------------------------------
// Loader helpers
// ----------------------------------------
function showLoader(){
    loader.style.display = "block";
    card.style.display = "none";
}

function hideLoader(){
    loader.style.display = "none";
}

// ----------------------------------------
// Recent searches (localStorage)
// ----------------------------------------
function getRecentCities(){
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveRecentCity(city){
    let recent = getRecentCities();

    // Remove duplicate (case-insensitive) so the city moves to the front
    recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());

    recent.unshift(city);
    recent = recent.slice(0, MAX_RECENT);

    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    renderRecentCities();
}

function renderRecentCities(){
    const recent = getRecentCities();

    recentList.textContent = "";

    if(recent.length === 0){
        recentTitle.style.display = "none";
        return;
    }

    recentTitle.style.display = "block";

    recent.forEach(city => {
        const chip = document.createElement("button");
        chip.textContent = city;
        chip.classList.add("recentChip");

        chip.addEventListener("click", async () => {
            cityInput.value = city;
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
            await loadWeather(apiUrl);
        });

        recentList.appendChild(chip);
    });
}

// Show any saved recent searches when the page first loads
renderRecentCities();
