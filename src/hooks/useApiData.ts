import { useEffect, useState } from "react";
import { ApiError } from "../services/api";
import { useJourney } from "../context/JourneyContext";

/** Carga datos de la API al montar la pantalla (y cuando cambian las dependencias). */
export function useApiData<T>(load: (token: string) => Promise<T>, deps: unknown[] = []) {
  const { token } = useJourney();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    load(token)
      .then((value) => active && setData(value))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : "No pudimos cargar estos datos."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ...deps]);
  return { data, error, loading };
}
