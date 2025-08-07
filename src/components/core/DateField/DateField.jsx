import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import './DateField.css';
import { useTranslation } from '../../../usr/i18n';

const DateField = ({
  id,
  name,
  value,
  onChange,
  onBlur = () => {},
  onFocus = () => {},
  variant,
  placeholder,
  disabled = false,
  invalid = false,
  className = '',
  label = '',
  showClear = true,
  errorMessage = '',
  required = false,
  requiredErrorMessage,
  minDate,
  maxDate,
  dateFormat = 'mm/dd/yy',
  showIcon = true,
  showTime = false,
  timeOnly = false,
  hourFormat = '12',
  showSeconds = false,
  monthNavigator = false,
  yearNavigator = false,
  yearRange,
  disabledDates,
  disabledDays,
  readOnlyInput = false,
  panelClassName,
  touchUI = false,
  inline = false,
  selectionMode = 'single',
  numberOfMonths = 1,
  view = 'date',
  iconPosition = 'right',
  panelStyle,
  inputStyle,
  inputClassName,
  tooltip,
  tooltipOptions,
  locale,
  mask = null,
  autoClear = false,
  keepInvalid = true,
  stepHour = 1,
  stepMinute = 1,
  stepSecond = 1
}) => {
  const [selectedDate, setSelectedDate] = useState(value);
  const [isInvalid, setIsInvalid] = useState(invalid);
  const [error, setError] = useState(errorMessage);
  const [isTouched, setIsTouched] = useState(false);
  const calendarRef = useRef(null);
  const componentRef = useRef(null);

  const { translate } = useTranslation();
  placeholder ??= translate("COMPONENTS.SELECT_DATE");
  requiredErrorMessage ??= translate("COMPONENTS")

  // Function to check if component is inside a dialog
  const checkIfInsideDialog = () => {
    let parent = componentRef.current;
    while (parent) {
      if (
        parent.classList?.contains('p-dialog') || 
        parent.classList?.contains('p-dialog-content') ||
        parent.classList?.contains('p-dialog-wrapper')
      ) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  // Handle z-index for datepicker panels
  useEffect(() => {
    const isInsideDialog = checkIfInsideDialog();
    
    // Create observer to watch for panel elements being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // Check if the added node is a datepicker panel
          if (node.nodeType === 1 && node.classList && node.classList.contains('p-datepicker')) {
            // Set z-index based on context
            node.style.zIndex = isInsideDialog ? '2001' : '999';
          }
        });
      });
    });
    
    // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true });
    
    // Cleanup function
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setSelectedDate(value);
    
    // Check if field is required but empty
    if (required) {
      const isEmpty = value === null || value === undefined || value === '';
      
      // Show errors if field is touched OR invalid prop is true
      setIsInvalid(invalid || (isTouched && isEmpty));
      setError(isEmpty ? requiredErrorMessage : errorMessage);
    } else {
      setIsInvalid(invalid);
      setError(errorMessage);
    }
  }, [value, invalid, errorMessage, required, requiredErrorMessage, isTouched]);

  const validateField = (val) => {
    if (required) {
      const isEmpty = val === null || val === undefined || val === '';
      
      setIsInvalid(invalid || (isTouched && isEmpty));
      setError(isEmpty ? requiredErrorMessage : errorMessage);
      return isEmpty;
    }
    return false;
  };

  const handleChange = (e) => {
    const newValue = e.value;
    
    setSelectedDate(newValue);
    
    if (isTouched) {
      validateField(newValue);
    }
    
    if (onChange) {
      onChange({
        originalEvent: e,
        target: {
          name,
          value: newValue
        },
        value: newValue
      });
    }
  };

  const handleBlur = (e) => {
    setIsTouched(true);
    validateField(selectedDate);
    onBlur(e);
  };

  const handleFocus = (e) => {
    onFocus(e);
  };

  return (
    <div 
      ref={componentRef}
      className={classNames(`date-field-wrapper ${className}`, {
        "standalone": variant === 'standalone'
      })}
    >
      {label && (
        <div className="date-field-label">
          {label}
          {required && <span className="p-error-indicator">*</span>}
        </div>
      )}
      
      <Calendar
        id={id}
        name={name}
        ref={calendarRef}
        value={selectedDate}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        dateFormat={dateFormat}
        showIcon={showIcon}
        showTime={showTime}
        timeOnly={timeOnly}
        hourFormat={hourFormat}
        showSeconds={showSeconds}
        monthNavigator={monthNavigator}
        yearNavigator={yearNavigator}
        yearRange={yearRange}
        disabledDates={disabledDates}
        disabledDays={disabledDays}
        readOnlyInput={readOnlyInput}
        panelClassName={panelClassName}
        touchUI={touchUI}
        inline={inline}
        selectionMode={selectionMode}
        numberOfMonths={numberOfMonths}
        view={view}
        showButtonBar={showClear}
        showClear={showClear}
        iconPos={iconPosition}
        panelStyle={panelStyle}
        inputStyle={inputStyle}
        inputClassName={`${inputClassName || ''} ${isInvalid ? 'p-invalid' : ''}`}
        className={`date-field ${isInvalid ? 'p-invalid' : ''}`}
        tooltip={tooltip}
        tooltipOptions={tooltipOptions}
        locale={locale}
        mask={mask}
        autoClear={autoClear}
        keepInvalid={keepInvalid}
        stepHour={stepHour}
        stepMinute={stepMinute}
        stepSecond={stepSecond}
      />
      
      <div className="date-field-error">{isInvalid && error}</div>
    </div>
  );
};

export default DateField;