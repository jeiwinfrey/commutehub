"use client";

import { useEffect, useState } from "react";

export type Hour = { date: string; h: number; temp: number; rain: number; code: number };
export type Weather = {
  temp: number;
  feels: number;
  humidity: number;
  wind: number; // km/h
  uv: number; // today's peak
  maxRain: number; // today's peak chance, %
  rainChance: number; // chance in the coming hour, %
  code: number;
  label: string;
  rainy: boolean;
  hot: boolean;
  today: string; // YYYY-MM-DD in the forecast location
  nowHour: number;
  hours: Hour[]; // today and tomorrow, hourly
};

export function codeLabel(code: number) {
  if (code === 0) return "Clear";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code === 61 || code === 80) return "Light rain";
  if (code === 63 || code === 81) return "Rain";
  if (code === 65 || code === 82) return "Heavy rain";
  if (code >= 95) return "Thunderstorm";
  return "Fair";
}

export const isWet = (code: number) => (code >= 51 && code <= 67) || (code >= 80 && code <= 99);

const KEY = "weather-v2";

export function useWeather(lat = 18.1978, lng = 120.5936) {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(KEY);
      if (cached) setW(JSON.parse(cached));
    } catch {}
    const q = [
      `latitude=${lat}`, `longitude=${lng}`, "timezone=auto", "forecast_days=2",
      "current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
      "hourly=temperature_2m,precipitation_probability,weather_code",
      "daily=uv_index_max,precipitation_probability_max",
    ].join("&");
    fetch(`https://api.open-meteo.com/v1/forecast?${q}`)
      .then((r) => r.json())
      .then((j) => {
        // times are in the forecast location's own timezone, so read hours from the strings
        const today = String(j.current.time).slice(0, 10);
        const nowHour = Number(String(j.current.time).slice(11, 13));
        const hours: Hour[] = (j.hourly.time as string[]).map((t, i) => ({
          date: t.slice(0, 10),
          h: Number(t.slice(11, 13)),
          temp: Math.round(j.hourly.temperature_2m[i]),
          rain: j.hourly.precipitation_probability[i] ?? 0,
          code: j.hourly.weather_code[i],
        }));
        const at = hours.findIndex((x) => x.date === today && x.h === nowHour);
        const rainChance = hours[at + 1]?.rain ?? 0;
        const temp = Math.round(j.current.temperature_2m);
        const next: Weather = {
          temp,
          feels: Math.round(j.current.apparent_temperature),
          humidity: Math.round(j.current.relative_humidity_2m),
          wind: Math.round(j.current.wind_speed_10m),
          uv: Math.round(j.daily.uv_index_max[0] ?? 0),
          maxRain: j.daily.precipitation_probability_max[0] ?? 0,
          rainChance,
          code: j.current.weather_code,
          label: codeLabel(j.current.weather_code),
          rainy: rainChance >= 50,
          hot: temp >= 33,
          today,
          nowHour,
          hours,
        };
        try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
        setW(next);
      })
      .catch(() => {});
  }, [lat, lng]);
  return w;
}
