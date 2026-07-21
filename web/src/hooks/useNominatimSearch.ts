import { useEffect, useRef, useState } from "react";
import type { NominatimResult } from "../utils/ubicacion";

const DEBOUNCE_MS = 450;

/**
 * Autocompletar ubicación con Nominatim (OpenStreetMap) — gratis, sin API
 * key. No bloquea nada si la persona no elige una sugerencia de la lista.
 */
export function useNominatimSearch(query: string) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setError(false);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      const url =
        "https://nominatim.openstreetmap.org/search?q=" +
        encodeURIComponent(query) +
        "&format=json&addressdetails=1&limit=6&countrycodes=ar&accept-language=es";
      fetch(url, { headers: { Accept: "application/json" } })
        .then((res) => res.json())
        .then((data: unknown) => {
          setLoading(false);
          setSuggestions(Array.isArray(data) ? (data as NominatimResult[]) : []);
        })
        .catch(() => {
          setLoading(false);
          setError(true);
          setSuggestions([]);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query]);

  return { suggestions, loading, error };
}
