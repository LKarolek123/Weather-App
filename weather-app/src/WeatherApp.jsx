import { useState, useEffect } from "react";

const cities = {
    "Warsaw": { lat: 52.23, lon: 21.01 },
    "London": { lat: 51.51, lon: -0.13 },
    "Tokyo": { lat: 35.68, lon: 139.76 },
    "New York": { lat: 40.71, lon: -74.01 },
    "Madrid": { lat: 40.42, lon: -3.70 }
};

const WeatherApp = () => {
    const [weather, setWeather] = useState(null);
    const [city, setCity] = useState("Warsaw");
    const [localWeather, setLocalWeather] = useState(null);
    const [localTime, setLocalTime] = useState(null);
    const [times, setTimes] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCityList, setShowCityList] = useState(false);

    // Pobieranie godziny dla miasta
    const fetchTime = async (cityName) => {
        try {
            const { lat, lon } = cities[cityName];
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto`
            );
            const now = new Date();
            now.setHours(now.getHours() + 3); // Korekcja UTC+3
            const data = await response.json();
            setTimes((prev) => ({
                ...prev,
                [cityName]: new Intl.DateTimeFormat("pl-PL", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: data.timezone
                }).format(now)
            }));
        } catch (err) {
            console.error("Błąd pobierania godziny:", err);
        }
    };

    const fetchWeather = async (selectedCity) => {
        setLoading(true);
        setError(null);
        try{
            const { lat, lon } = cities[selectedCity];
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
            );
            const data = await response.json();
            setWeather(data.current);
            setCity(selectedCity);
            fetchTime(selectedCity);
        }
        catch (err){
            setError("Błąd pobierania danych!");
        }
        finally{
            setLoading(false);
            setShowCityList(false); // Zamykamy listę po wyborze miasta
        }
    };

    const fetchLocalWeather = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
                    );
                    const data = await response.json();
                    const now = new Date();
                    now.setHours(now.getHours() + 3); // Korekcja UTC+3
                    setLocalWeather(data.current);
                    setLocalTime(
                        new Intl.DateTimeFormat("pl-PL", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: data.timezone
                        }).format(now)
                    );
                } catch (err) {
                    setError("Nie można pobrać lokalnej pogody.");
                }
            });
        } else {
            setError("Twoja przeglądarka nie obsługuje geolokalizacji.");
        }
    };

    useEffect(() => {
        fetchWeather(city);
        fetchLocalWeather();
    }, []);
    
    return (
        <div className="weather-card">
            <h2>🌍 Pogoda w {city}</h2>
            {loading && <p>⏳ Ładowanie...</p>}
            {error && <p>❌ {error}</p>}
            {weather && (
                <div>
                    <p>🌡️ Temperatura: {weather.temperature_2m}°C</p>
                    <p>💨 Wiatr: {weather.windspeed_10m} km/h</p>
                    <p>🕒 Czas lokalny: {times[city] || "Ładowanie..."}</p>
                </div>
            )}

            <button onClick={() => setShowCityList(!showCityList)}>
                🌆 Wybierz miasto
            </button>

            {showCityList && (
                <ul className="city-list">
                    {Object.keys(cities).map((cityName) => (
                        <li key={cityName}>
                            <button onClick={() => fetchWeather(cityName)}>
                                {cityName}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={() => fetchWeather(city)}>🔄 Odśwież</button>

            <h3>📍 Pogoda w Twojej lokalizacji</h3>
            {localWeather ? (
                <div>
                    <p>🌡️ Temperatura: {localWeather.temperature_2m}°C</p>
                    <p>💨 Wiatr: {localWeather.windspeed_10m} km/h</p>
                    <p>🕒 Czas: {localTime || "Ładowanie..."}</p>
                </div>
            ) : (
                <p>🔄 Pobieranie danych...</p>
            )}
            <button onClick={fetchLocalWeather}>📍 Odśwież lokalną pogodę</button>
        </div>
    );
}
export default WeatherApp