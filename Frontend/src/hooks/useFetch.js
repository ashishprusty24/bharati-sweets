import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { message } from "antd";

const useFetch = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(endpoint);
      setData(result);
    } catch (err) {
      setError(err.message);
      if (!options.silent) {
        message.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, options.silent]);

  useEffect(() => {
    if (!options.manual) {
      fetchData();
    }
  }, [fetchData, options.manual]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
