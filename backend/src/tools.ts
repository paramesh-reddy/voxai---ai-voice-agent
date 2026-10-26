const WEATHER_CODES: Record<number, string> = {
  0: 'clear sky',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'foggy',
  48: 'foggy',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  80: 'rain showers',
  81: 'rain showers',
  82: 'heavy rain showers',
  95: 'thunderstorm',
  96: 'thunderstorm with hail',
  99: 'thunderstorm with hail',
};

export interface LiveWeather {
  location: string;
  country?: string;
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windKmh: number;
  condition: string;
  observedAt: string;
  timezone: string;
}

async function readJson(url: string): Promise<any> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }
  return response.json();
}

async function locate(query?: string): Promise<{ name: string; country?: string; latitude: number; longitude: number } | null> {
  const place = query?.trim();
  if (place) {
    const data = await readJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`
    );
    const hit = data?.results?.[0];
    if (!hit) return null;
    return {
      name: [hit.name, hit.admin1].filter(Boolean).join(', '),
      country: hit.country,
      latitude: hit.latitude,
      longitude: hit.longitude,
    };
  }

  const ip = await readJson('https://ipwho.is/');
  if (!ip?.success || typeof ip.latitude !== 'number' || typeof ip.longitude !== 'number') {
    return null;
  }
  return {
    name: [ip.city, ip.region].filter(Boolean).join(', ') || 'your area',
    country: ip.country,
    latitude: ip.latitude,
    longitude: ip.longitude,
  };
}

export async function getCurrentWeather(location?: string): Promise<LiveWeather | { error: string }> {
  try {
    const place = await locate(location);
    if (!place) {
      return { error: location ? `No place found for "${location}".` : 'Could not detect the current location. Ask for a city name.' };
    }

    const data = await readJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&timezone=auto&temperature_unit=celsius&wind_speed_unit=kmh'
    );
    const current = data?.current;
    if (!current || typeof current.temperature_2m !== 'number') {
      return { error: 'The weather service did not return a current temperature.' };
    }

    const code = Number(current.weather_code);
    return {
      location: place.name,
      country: place.country,
      temperatureC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidityPercent: current.relative_humidity_2m,
      windKmh: current.wind_speed_10m,
      condition: WEATHER_CODES[code] || 'unknown conditions',
      observedAt: current.time,
      timezone: data.timezone || 'auto',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Weather lookup failed.';
    return { error: message };
  }
}
