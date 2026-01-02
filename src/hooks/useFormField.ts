import { useState, useCallback } from 'react';

/**
 * Custom hook for managing a form field with local state
 * Provides value, onChange handler, and update function
 */
export const useFormField = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return {
    value,
    handleChange,
    updateValue,
  };
};

