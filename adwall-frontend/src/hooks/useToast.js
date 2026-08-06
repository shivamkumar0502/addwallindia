import { useState, useCallback } from "react";
const useToast = () => {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, showToast };
};
export default useToast;
