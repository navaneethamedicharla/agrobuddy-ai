import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
}

const weatherDescription = (code: number): string => {
  const map: Record<number, string> = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Moderate showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
  };
  return map[code] ?? "Unknown";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { location } = await req.json();
    if (!location || typeof location !== "string") {
      return new Response(JSON.stringify({ error: "location required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Geocode via Open-Meteo (no key needed)
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    const geoJson = await geo.json();
    if (!geoJson.results?.length) {
      return new Response(JSON.stringify({ error: "Location not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { latitude, longitude, name, country, admin1 } = geoJson.results[0];

    const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=5`);
    const w = await wRes.json();

    const current = {
      temp: w.current.temperature_2m,
      feelsLike: w.current.apparent_temperature,
      humidity: w.current.relative_humidity_2m,
      precipitation: w.current.precipitation,
      windSpeed: w.current.wind_speed_10m,
      weatherCode: w.current.weather_code,
      description: weatherDescription(w.current.weather_code),
    };

    const forecast: WeatherDay[] = w.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: w.daily.temperature_2m_max[i],
      tempMin: w.daily.temperature_2m_min[i],
      precipitation: w.daily.precipitation_sum[i],
      weatherCode: w.daily.weather_code[i],
      windSpeed: w.daily.wind_speed_10m_max[i],
    }));

    // Farming alerts
    const alerts: { type: string; severity: string; message: string }[] = [];
    forecast.forEach((d) => {
      if (d.precipitation > 20) alerts.push({ type: "Heavy Rain", severity: "high", message: `Heavy rain expected on ${d.date} (${d.precipitation}mm). Delay spraying & harvesting.` });
      if (d.tempMax > 38) alerts.push({ type: "Heat Wave", severity: "high", message: `High temperature on ${d.date} (${d.tempMax}°C). Increase irrigation & provide shade for sensitive crops.` });
      if (d.tempMin < 5) alerts.push({ type: "Frost Risk", severity: "high", message: `Frost risk on ${d.date} (${d.tempMin}°C). Protect young plants.` });
      if (d.windSpeed > 40) alerts.push({ type: "High Winds", severity: "medium", message: `Strong winds on ${d.date} (${d.windSpeed} km/h). Stake tall plants.` });
    });

    return new Response(JSON.stringify({
      location: { name, country, region: admin1, latitude, longitude },
      current, forecast, alerts,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("weather error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
