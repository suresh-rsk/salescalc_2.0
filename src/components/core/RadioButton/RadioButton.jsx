import React, { useState } from 'react';
import './RadioButton.css';

const RadioButton = ({
  options,
  name,
  onChange,
  value,
  disabled,
  defaultValue = null,
  className = '',
  labelClassName = '',
  radioClassName = '',
  hideLabel = false, 
  layout = 'vertical',
  required = false,
  id = '',
  label = ''
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value !== undefined ? value : internalValue;
  const showError = required && value?.length === 0;
  const handleChange = (event) => {
    const newValue = event.target.value;
    if (value === undefined) {
      setInternalValue(newValue);
    }
    if (onChange) {
      onChange(event);
    }
  };

  const isHorizontal = layout === 'horizontal';

  return (
    <div className={`radio-group-container ${className}`}>
      {!hideLabel && label?.trim() && (
        <div className="radio-group-label">
          {label} {required && <span className="required">*</span>}
        </div>
      )}
      <div
        className={`radio-button-wrapper ${isHorizontal ? 'horizontal' : 'vertical'}`}
        style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          gap: '0.5rem'
        }}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`radio-label ${labelClassName} ${selectedValue === option.value ? 'selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              id={`${id}-${option.value}`}
              name={name}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={handleChange}
              className={`radio-input ${radioClassName}`}
              disabled={disabled}
            />
            <span className="radio-text">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RadioButton;