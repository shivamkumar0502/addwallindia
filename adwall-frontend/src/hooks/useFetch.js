import { useState, useEffect, useCallback } from "react";

const useFetch = (fetchFn, deps = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true); setError(null);
    try {
      const res = await fetchFn(...args);
      setData(res.data.data);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally { setLoading(false); }
  }, deps);

  useEffect(() => { if (immediate) execute(); }, []);
  return { data, loading, error, execute, setData };
};
export default useFetch;
