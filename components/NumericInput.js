import React, { useState, useEffect, useCallback } from 'react';
import { AppTextInput as TextInput } from './AppText';

const NumericInput = ({ 
  value, 
  onValueChange, 
  placeholder, 
  editable, 
  style, 
  decimals = 2 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Función para formatear número
  const formatNumber = useCallback((num) => {
    if (num == null || num === '' || isNaN(Number(num))) return '';
    return Number(num).toFixed(decimals);
  }, [decimals]);

  // Efecto: actualizar display cuando el valor externo cambia y NO estamos enfocados
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value));
    }
  }, [value, isFocused, formatNumber]);

  const handleFocus = () => {
    setIsFocused(true);
    // Al enfocar, mostrar el valor CRUDO (sin formato)
    setDisplayValue(value != null ? String(value) : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Al desenfocar, formatear el valor
    const numericValue = parseFloat(displayValue) || 0;
    const formatted = numericValue.toFixed(decimals);
    setDisplayValue(formatted);
  };

  const handleChange = (text) => {
    // Limpiar: solo números y un punto
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    
    let finalValue;
    if (parts.length > 2) {
      finalValue = parts[0] + '.' + parts.slice(1).join('');
    } else {
      finalValue = cleaned;
    }
    
    setDisplayValue(finalValue);
    onValueChange(finalValue);
  };

  return (
    <TextInput
      value={displayValue}
      onChangeText={handleChange}
      placeholder={placeholder}
      editable={editable}
      keyboardType="numeric"
      style={style}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};

export default NumericInput;