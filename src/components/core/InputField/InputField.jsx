import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import PropTypes from 'prop-types';
import './InputField.css'; 

const InputField = ({
  id,
  name,
  label,
  value,
  onChange,
  onSearch = () => {},
  type = 'text',
  style = {},
  required = false,
  disabled = false,
  placeholder = '',
  className = '',
  errorMessage = '',
  regex = null,
  currencyOptions = {
    currency: 'USD',
    locale: 'en-US',
    minFractionDigits: 2,
    maxFractionDigits: 2
  },
  numberOptions = {
    minValue: null,
    maxValue: null,
    step: 1,
    allowDecimal: true,
    decimalPlaces: 2
  },
  tooltip = '',
  onBlur = () => {},
  onFocus = () => {},
  autoFocus = false,
  floatingLabel = false,
  showClear = false,
  showSearch = false,
  variant = null,
  invalid = false,
  maxLength

}) => {
  const [localValue, setLocalValue] = useState(value);
  const [localError, setLocalError] = useState(errorMessage);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
 
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
 
  // CRITICAL FIX: Update local error state when errorMessage OR invalid prop changes
  useEffect(() => {
    if (invalid && errorMessage) {
      setLocalError(errorMessage);
    } else if (!invalid && isTouched) {
      // Only clear error if not invalid and field has been touched
      const validationError = validateInput(localValue);
      setLocalError(validationError);
    } else if (!invalid && !isTouched) {
      // Clear error when not invalid and not touched
      setLocalError('');
    }
  }, [errorMessage, invalid]);
 
  // Validate based on input type
  const validateInput = (val) => {
    if (required && (val === null || val === undefined || val === '')) {
      return errorMessage ? errorMessage : "This field is required";;
    }
 
    if (val) {
      switch (type) {
        case 'email':{
          // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9_](\.?[a-zA-Z0-9_\-+%])*@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
          return emailRegex.test(val) ? '' : "Enter Valid Email address";
        }
        case 'regex':
          if (regex) {
            const regexPattern = new RegExp(regex);
            return regexPattern.test(val) ? '' : "Invalid input Format";
          }
          break;
       
        case 'number':{
          const numVal = parseFloat(val);
          if (isNaN(numVal)) {
            return errorMessage ? errorMessage : "Enter Valid number";
          }
          if (numberOptions.minValue !== null && numVal < numberOptions.minValue) {
            return errorMessage ? errorMessage : `Value should be at least ${numberOptions.minValue}`;
          }
          if (numberOptions.maxValue !== null && numVal > numberOptions.maxValue) {
            return errorMessage ? errorMessage :`Value should be at most ${numberOptions.maxValue}`;
          }
          break;
        }
        case 'currency':{
          const currencyVal = parseFloat(val);
          if (isNaN(currencyVal)) {
            return errorMessage ? errorMessage : "Enter Valid amount";
          }
          if (currencyVal < 0) {
            return errorMessage ? errorMessage : "Amount cannot be negative";
          }
          break;
        }
      }
    }
    return '';
  };
 
  const handleChange = (e) => {
    if(!isTouched)setIsTouched(true);
    let newValue;
   
    // Handle different event object structures based on component
    if (type === 'number' || type === 'currency') {
      newValue = e.value;
    } else {
      newValue = e.target.value;
    }
   
    setLocalValue(newValue);
   
    // Only validate if the field has been touched

      const error = validateInput(newValue);
      setLocalError(error);
    
   
    onChange(e);
  };
 
  const handleBlur = (e) => {
    setIsFocused(false);
    if(!isTouched)setIsTouched(true);
    
    // IMPORTANT FIX: If invalid is true, keep the error message
    if (invalid && errorMessage) {
      setLocalError(errorMessage);
    } else {
      const error = validateInput(localValue);
      setLocalError(error);
    }
    
    onBlur(e);
  };
 
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus(e);
  };
 
  const clearInput = (e) => {
    const newValue = type === 'number' || type === 'currency' ? null : '';
    setLocalValue(newValue);
    onChange({target:{value:newValue, id, name, type}});
  };
 
  const onSearchClick = () => {
    onSearch(value);
  }
 
  // Function to determine if input is filled (for floating label)
  const isInputFilled = () => {
    return localValue !== null &&
           localValue !== undefined &&
           localValue !== '' &&
           (type !== 'number' && type !== 'currency' ? true : !isNaN(localValue));
  };

  // Function to determine if we should show an error
  const shouldShowError = () => {
    // Always show error if invalid prop is true and we have an error message
    if (invalid && errorMessage) {
      return true;
    }
    
    // Show error if field has been touched and there's a validation error
    if (isTouched && localError) {
      return true;
    }
    
    return false;
  };
 
  const getInputElement = (isInValid) => {
    // FIXED: Use our new determination method but preserve the input parameter
    const isInvalid = isInValid;
    const isFilled = isInputFilled();
   
    const baseProps = {
      id,
      disabled,
      autoFocus,
      onBlur: handleBlur,
      onFocus: handleFocus,
      placeholder: floatingLabel ? ' ' : placeholder,
      tooltip: tooltip,
      className: classNames(
        className,
        {
          'p-invalid': isInvalid,
          'p-filled': isFilled || isFocused
        }
      ),
      style: { width: '100%' } // Enforce width
    };
 
    switch (type) {
      case 'number':
        return (
          <span className={classNames('p-input-icon-right', {
            'p-inputwrapper-filled': isFilled,
            'p-inputwrapper-focus': isFocused
          })}>
            {showClear && localValue !== null && !disabled && (
              <i className="pi pi-times" onClick={clearInput} style={{ cursor: 'pointer' }} />
            )}
            <InputNumber
              name={name}
              id={id}
              {...baseProps}
              value={localValue}
              onValueChange={handleChange}
              mode="decimal"
              useGrouping={false}
              minFractionDigits={numberOptions.allowDecimal ? numberOptions.decimalPlaces : 0}
              maxFractionDigits={numberOptions.allowDecimal ? numberOptions.decimalPlaces : 0}
              min={numberOptions.minValue}
              max={numberOptions.maxValue}
              step={numberOptions.step}
              inputClassName={classNames({ 'p-filled': isFilled })}
              inputStyle={{ width: '100%' }} // Direct style on input
              invalid={isInValid}
            />
          </span>
        );
     
      case 'currency':
        return (
          <span className={classNames('p-input-icon-right', {
            'p-inputwrapper-filled': isFilled,
            'p-inputwrapper-focus': isFocused
          })}>
            {showClear && localValue !== null && !disabled && (
              <i className="pi pi-times" onClick={clearInput} style={{
                cursor: 'pointer',
                position: 'absolute',
                right: '8px',
                zIndex: 5
              }} />
            )}
 
            <InputNumber
              name={name}
              id={id}
              {...baseProps}
              value={localValue}
              onValueChange={handleChange}
              mode="currency"
              currency={currencyOptions.currency || 'USD'}
              locale={currencyOptions.locale || 'en-US'}
              minFractionDigits={currencyOptions.minFractionDigits !== undefined ? currencyOptions.minFractionDigits : 2}
              maxFractionDigits={currencyOptions.maxFractionDigits !== undefined ? currencyOptions.maxFractionDigits : 2}
              showButtons={false}
              inputClassName={classNames({ 'p-filled': isFilled })}
              inputStyle={{
                width: '100%',
                paddingRight: showClear ? '30px' : '8px',
                textAlign: 'left'
              }}
              style={{ width: '100%' }}
              invalid={isInValid}
            />
          </span>
        );
     
      default: // text, email, regex
        return (
          <span className={classNames('p-input-icon-right', {
            'p-inputwrapper-filled': isFilled,
            'p-inputwrapper-focus': isFocused
          })}>
            {showClear && localValue && !disabled && (
              <i className="pi pi-times" onClick={clearInput} style={{ cursor: 'pointer' }} />
            )}
            {showSearch && !localValue && !disabled && (
              <i className="pi pi-search" />
            )}
            <InputText
              id={id}
              name={name}
              {...baseProps}
              type={type === 'email' ? 'email' : 'text'}
              value={localValue || ''}
              onChange={(e)=>handleChange(e)}
              invalid={isInValid}
              style={{width:"100%"}}
              maxLength={maxLength}
            />
          </span>
        );
    }
  };
 
  return (
    <div className={classNames("p-field", {
      "p-field-currency": type === 'currency',
      "p-field-number": type === 'number',
      "standalone": variant === 'standalone'
    })} style={style}>
      {/* 1. LABEL SECTION */}
      <div className="p-field-label-section">
        {!floatingLabel && label && (
          <label
            htmlFor={id}
            className={classNames('p-field-label', { 'p-error': shouldShowError() })}
          >
            {label}
            {required && <span className="p-error-indicator">*</span>}
          </label>
        )}
      </div>
     
      {/* 2. INPUT SECTION */}
      <div className="p-field-input-section">
        {floatingLabel ? (
          <span className="p-float-label">
            {getInputElement()}
            <label
              htmlFor={id}
              className={classNames({ 'p-error': shouldShowError() })}
            >
              {label}
              {required && <span className="p-error-indicator">*</span>}
            </label>
          </span>
        ) : (
          getInputElement(shouldShowError())
        )}
      </div>
     
      {/* 3. ERROR SECTION - CRITICAL FIX */}
      <div className="p-field-error-section">
        {shouldShowError() ? (
          <div className="p-field-error">{invalid ? errorMessage : localError}</div>
        ) : (
          <div className="p-field-error" style={{ visibility: 'hidden' }}>&nbsp;</div>
        )}
      </div>
    </div>
  );
};
 
InputField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  type: PropTypes.oneOf(['text', 'email', 'number', 'currency', 'regex']),
  style: PropTypes.object,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  errorMessage: PropTypes.string,
  regex: PropTypes.string,
  currencyOptions: PropTypes.object,
  numberOptions: PropTypes.object,
  invalid: PropTypes.bool,
  tooltip: PropTypes.string,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  autoFocus: PropTypes.bool,
  floatingLabel: PropTypes.bool,
  showClear: PropTypes.bool,
  showSearch: PropTypes.bool
};
 
export default InputField;