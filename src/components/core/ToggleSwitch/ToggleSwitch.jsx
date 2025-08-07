import React from 'react';
import { InputSwitch } from 'primereact/inputswitch';
import './ToggleSwitch.css';

const ToggleSwitch = ({
  options = [],
  value,
  onChange,
  label = '',
  disabled = false,
  invalid = false,
  className = '',
  size="md"
}) => {
  const [optionA, optionB] = options.slice(0, 2);

  const isChecked = value === optionA?.value;

  const handleChange = (e) => {
    const newValue = e.value ? optionA?.value : optionB?.value;
    onChange?.({target:{value:newValue}});
  };

  return (
    <div className={`toggle-switch-group ${className} ${size}`}>
      {label && (
        <div className="toggle-label">
          {label}
        </div>
      )}
      <div className="toggle-container">
        <span className={`toggle-option left-option ${isChecked ? 'active' : ''}`}>{optionB?.label}</span>
        <InputSwitch
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className={invalid ? 'p-invalid' : ''}
        />
        <span className={`toggle-option right-option ${!isChecked ? 'active' : ''}`}>{optionA?.label}</span>
      </div>
    </div>
  );
};

export default ToggleSwitch;
