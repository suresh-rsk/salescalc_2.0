import React, { useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import './CheckBox.css';
import { useTranslation } from '../../../usr/i18n';

const CheckBox = ({
  options = [],
  value = [],
  onChange,
  layout = 'vertical',
  className = '',
  checkboxClassName = '',
  label = '',
  disabled = false,
  required = false,
  variant,
  errorMessage
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const handleCheckboxChange = (optionValue) => {
    if (disabled) return;

    setIsTouched(true);

    const selected = [...value];
    const index = selected.indexOf(optionValue);

    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      selected.push(optionValue);
    }

    onChange?.(selected);
  };

  const { translate } = useTranslation();
  errorMessage ??= translate("COMPONENTS.REQUIRED_FIELD");

  const layoutClass = layout === 'horizontal' ? 'checkbox-horizontal' : 'checkbox-vertical';
  const showError = required && value.length === 0;

  return (
    <div className={`checkbox-group ${className}`}>
      {label && (variant !== "standalone") && (
        <div className="checkbox-label">
          {label} {required && <span className="required">*</span>}
        </div>
      )}

      <div className={`checkbox-wrapper ${layoutClass}`}>
        {options.map((option) => (
          <div key={option.value} className={`checkbox-item ${checkboxClassName}`}>
            <Checkbox
              inputId={`checkbox-${option.value}`}
              value={option.value}
              onChange={() => handleCheckboxChange(option.value)}
              checked={value.includes(option.value)}
              disabled={disabled}
            />
            <label htmlFor={`checkbox-${option.value}`}>{option.label}</label>
          </div>
        ))}
      </div>

      <div className="checkbox-error">{showError && isTouched && (variant !== "standalone") && errorMessage}</div>
    </div>
  );
};

export default CheckBox;
