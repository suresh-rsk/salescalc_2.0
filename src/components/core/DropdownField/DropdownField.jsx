import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { MultiSelect } from 'primereact/multiselect';
import './DropdownField.css';
import ButtonWrapper from '../Button/Button';
import { classNames } from 'primereact/utils';
import { RadioButton } from 'primereact/radiobutton';
import { InputNumber } from 'primereact/inputnumber';
import { useTranslation } from '../../../usr/i18n';

// Add custom CSS for radio dropdown styling
const customStyles = {
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    gap: '2px'
  },
  radioLabel: {
    cursor: 'pointer'
  },
  inputContainer: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    width:"100px",
    position: "relative"
  },
  inputNumber: {
    width: '100px',
    height: '32px'
  }
};

const DropdownField = ({
  id,
  name,
  options = [],
  value,
  onChange,
  onSelectAll,
  variant,
  display,
  mode = 'dropdown', 
  emptyFilterMessage,
  placeholder = 'Select',
  disabled = false,
  filter,
  filterPlaceholder,
  invalid = false,
  className = '',
  dropdownClassName = '',
  label = '',
  showClear,
  errorMessage = '', 
  required = false, 
  showFooterButtons = true,
  maxSelectedLabels,
  requiredErrorMessage,
  okLabel,
  cancelLabel,
  optionLabel,
  optionGroupChildren,
  optionGroupLabel,
  optionGroupTemplate,
  panelClassName,
  emptyMessage,
  onBlur = () => {},
  onFocus = () => {},
  radioMode = false, // New prop to enable radio button mode
  radioOptions = [], // Options for radio buttons
  inputOption = null, // Option that should display an input field
  inputValue = null // Value for the input field
}) => {

  const [selectedValue, setSelectedValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isInvalid, setIsInvalid] = useState(invalid);
  const [error, setError] = useState(errorMessage);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);
  const componentRef = useRef(null);
  const [selection, setSelection] = useState([]);             // only for chip
  const [allSelection, setAllSelection] = useState(false);    // only for chip
  const [tempSelection, setTempSelection] = useState(false);
  const [selectedRadioOption, setSelectedRadioOption] = useState(value);
  const [radioInputValue, setRadioInputValue] = useState(inputValue);
  // State for temporary input value (only committed on OK)
  const [tempInputValue, setTempInputValue] = useState(inputValue);

  // Add new state to track if component is inside a dialog
  const [isInsideDialog, setIsInsideDialog] = useState(false);
  const { translate } = useTranslation();
  requiredErrorMessage ??= translate("COMPONENTS.REQUIRED_FIELD");
  emptyMessage ??= translate("COMPONENTS.NO_OPTIONS");

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

  // Function to apply correct z-index to dropdown panels
  const setupDropdownPanel = () => {
    // Use setTimeout to ensure this runs after the panel is created
    setTimeout(() => {
      // Find all dropdown panels in the document
      const panels = document.querySelectorAll('.p-dropdown-panel, .p-multiselect-panel, .p-autocomplete-panel');
      const lastPanel = panels[panels.length - 1]; // Most recently created panel
      
      if (lastPanel) {
        if (isInsideDialog) {
          // Inside dialog - set higher z-index
          lastPanel.style.zIndex = '2001';
        } else {
          // Default case - below header
          lastPanel.style.zIndex = '999';
        }
      }
    }, 0);
  };

  // Setup when component mounts
  useEffect(() => {
    // Check if inside dialog and set state
    setIsInsideDialog(checkIfInsideDialog());
  }, []);

  useEffect(() => {
    setSelectedValue(value);
    setSelectedRadioOption(value);
    setRadioInputValue(inputValue);
    setTempInputValue(inputValue);
    
    // Check if field is required but empty
    if (required) {
      const isEmpty = 
        value === null || 
        value === undefined || 
        (Array.isArray(value) && value.length === 0) || 
        value === '';
      
      // Show errors if field is touched OR invalid prop is true
      setIsInvalid(invalid || (isTouched && isEmpty));
      setError(isEmpty ? requiredErrorMessage : errorMessage);
    } else {
      setIsInvalid(invalid);
      setError(errorMessage);
    }
  }, [value, inputValue, invalid, errorMessage, required, requiredErrorMessage, isTouched]);

  const validateField = (val) => {
    if (required) {
      const isEmpty = 
        val === null || 
        val === undefined || 
        (Array.isArray(val) && val.length === 0) || 
        val === '';
      
      setIsInvalid(invalid || (isTouched && isEmpty));
      setError(isEmpty ? requiredErrorMessage : errorMessage);
      return isEmpty;
    }
    return false;
  };

  const search = (event) => {
    setTimeout(() => {
      let filtered;

      if (!event.query.trim().length) {
        filtered = [...options];
      }
      else {
        filtered = options.filter((option) => {
          return option.label.toLowerCase().startsWith(event.query.toLowerCase());
        });
      }

      setFilteredOptions(filtered);
    }, 250);
  };

  const handleChange = (e) => {
    if(display === "chip"){
      const newValue = e.value;
      if(!tempSelection){
        setTempSelection(true);
        setAllSelection(selectAll);
        setSelection(selectedValue);
      }
      setSelectedValue(newValue);
      setSelectAll(newValue.length === options.length);
      
      if (isTouched) {
        validateField(newValue);
      }
    } else {
      const newValue = e.value;
    
      if (mode === "multiselect") {
        setSelectedValue(newValue);
        setSelectAll(newValue.length === options.length);
      } else {
        setSelectedValue(newValue);
      }
      
      if (isTouched) {
        validateField(newValue);
      }
      
      if (onChange && mode !== "multiselect") {
        onChange(e);
      }
      if (onSelectAll) {
        onSelectAll(e);
      }
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setIsTouched(true);
    validateField(selectedValue);
    onBlur(e);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus(e);
  };

  const handleSelectAll = (e) =>{
      setSelectedValue(e.checked ? [] : options.map((item) => item.value));
      setSelectAll(!e.checked);
  }

  const handleRadioChange = (e) => {
    setSelectedRadioOption(e.value);
    if (onChange) {
      onChange({
        target: { name, value: e.value },
        value: e.value,
        originalEvent: e.originalEvent
      });
    }
    setIsTouched(true);
  };

  const handleInputNumberChange = (e) => {
    // Only update the temporary input value
    setTempInputValue(e.value);
    
    // Also select the radio option associated with the input
    if (inputOption) {
      setSelectedRadioOption(inputOption.value);
      // Note: We don't call onChange here as we want to wait for the OK button
    }
  };

  const itemTemplate = (item) => {
    return item.label;
  };

  const selectedItemTemplate = (item) => {
    if (item) {
      return item.label;
    }
    return placeholder;
  };

  const handleCancelClick = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (radioMode) {
      // For radio mode, revert to previous input value
      setTempInputValue(radioInputValue);
      dropdownRef?.current?.hide?.();
      return;
    }
    
    // Original behavior for chip display
    setSelectAll(allSelection);
    setSelectedValue(selection);
    if (onChange) {
      onChange({target:{value:selection, name}});
    }
    setTempSelection(false);
    setIsTouched(true); 
    dropdownRef?.current?.hide?.();
  }

  const handleOkClick = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (radioMode) {
      // For radio mode with input option selected
      if (inputOption && selectedRadioOption === inputOption.value) {
        // Update the actual radioInputValue with the temporary value
        setRadioInputValue(tempInputValue);
        
        // Notify parent with standard e.target.value format
        if (onChange) {
          onChange({
            target: {
              name,
              value: tempInputValue // Use the input value as the overall value
            },
            value: tempInputValue
          });
        }
      } else {
        // For regular radio options
        if (onChange) {
          onChange({
            target: {
              name,
              value: selectedRadioOption
            },
            value: selectedRadioOption
          });
        }
      }
      
      dropdownRef?.current?.hide?.();
      return;
    }
    
    // Original multiselect behavior for chip display
    if (onChange) {
      onChange({target:{value:selectedValue}});
    }
    if (onSelectAll) {
      onSelectAll({target:{value:selectedValue}});
    }
    setTempSelection(false);
    setIsTouched(true); 
    validateField(selectedValue);
    setSelection(selectedValue);
    dropdownRef?.current?.hide?.();
  }

  const footerTemplate = () => {
    return (
      <div className="p-multiselect-footer-div">
        <ButtonWrapper
          label= {cancelLabel || translate("COMMON.CANCEL") }
          onClick={handleCancelClick}
          size="sm"
          outlined
        />
        <ButtonWrapper 
          label = {okLabel || translate("COMMON.OK")} 
          onClick={handleOkClick} 
          size="sm"
        />
      </div>
    );
  };

  const radioFooterTemplate = () => {
    const preventClose = (e) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
    };
    
    return (
      <div 
        className="p-multiselect-footer-div" 
        onClick={preventClose}
        onMouseDown={preventClose}
      >
        <ButtonWrapper
          label={okLabel || translate("COMMON.OK")}
          onClick={handleOkClick}
          size="sm"
        />
        <ButtonWrapper 
          label={cancelLabel || translate("COMMON.CANCEL")} 
          onClick={handleCancelClick} 
          size="sm"
          outlined
        />
      </div>
    );
  };

  const GroupTemplate = (option) =>{
    return <p className='option-group-header'>{option.label}</p>
  }
  
  // Custom value template for the dropdown display
  const radioValueTemplate = (option) => {
    if (!option) return placeholder;
    
    // For the input option, show the input value instead of the option label
    if (inputOption && option.value === inputOption.value) {
      return radioInputValue !== null ? radioInputValue.toString() : option.label;
    }
    
    return option.label;
  };
  
  // Common props for all dropdown types
  const commonProps = {
    disabled,
    placeholder,
    required,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onShow: setupDropdownPanel // Apply z-index when dropdown opens
  };

  // Radio item template
  const radioItemTemplate = (option) => {
    const preventClose = (e) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
    };

    return (
      <div style={customStyles.radioOption}>
        <RadioButton
          inputId={`${id}_${option.value}`}
          name={`${name}_radio`}
          value={option.value}
          onChange={handleRadioChange}
          checked={selectedRadioOption === option.value}
        />
        <label htmlFor={`${id}_${option.value}`} style={customStyles.radioLabel}>
          {inputOption && option.value === inputOption.value ? "" : option.label}
        </label>
        
        {/* Show input field if this option is the inputOption */}
        {inputOption && option.value === inputOption.value && (
          <div 
            style={customStyles.inputContainer} 
            onClick={preventClose} // Prevent dropdown from closing
            onMouseDown={preventClose} // Prevent dropdown from closing
          >
            <InputNumber
              id={`${id}_input`}
              value={tempInputValue}
              onChange={handleInputNumberChange}
              onFocus={(e) => {
                preventClose(e);
                // Auto-select the radio button when focusing on the input
                setSelectedRadioOption(option.value);
              }}
              min={0}
              showButtons
              decrementButtonClassName="p-button-secondary"
              incrementButtonClassName="p-button-secondary"
              incrementButtonIcon="pi pi-angle-up"
              decrementButtonIcon="pi pi-angle-down"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={componentRef}
      className={classNames(`dropdown-field-wrapper ${className}`, {
        "standalone": variant === 'standalone'
      })}
    >
      {label && (
        <div className="dropdown-field-label">
          {label}
          {required && <span className="p-error-indicator">*</span>}
        </div>
      )}
      
      {/* Radio Mode Dropdown */}
      {radioMode && (
        <Dropdown
          id={id}
          name={name}
          {...commonProps}
          value={selectedRadioOption}
          options={radioOptions}
          onChange={handleRadioChange}
          className={`${className} ${isInvalid ? 'p-invalid' : ''}`}
          showClear={showClear}
          panelClassName={`radio-panel ${panelClassName || ''}`}
          panelFooterTemplate={radioFooterTemplate}
          itemTemplate={radioItemTemplate}
          valueTemplate={radioValueTemplate}
          ref={dropdownRef}
        />
      )}
      
      {/* Standard Autocomplete */}
      {!radioMode && (mode === "autocomplete") &&      
          <AutoComplete
            id={id}
            name={name}
            {...commonProps}
            value={selectedValue}
            suggestions={filteredOptions}
            completeMethod={search}
            field="label"
            onChange={(e)=>handleChange(e)}
            className={`${dropdownClassName} ${isInvalid ? 'p-invalid' : ''}`}
            itemTemplate={itemTemplate}
            selectedItemTemplate={selectedItemTemplate}
            panelClassName={panelClassName}
            ref={dropdownRef}
          />
        }

      {/* Standard Dropdown */}
      {!radioMode && (mode === "dropdown") && 
          <Dropdown 
            id={id}
            name={name}
            {...commonProps}
            value={selectedValue}
            options={options}
            onChange={(e)=>handleChange(e)} 
            optionLabel="label"
            // virtualScrollerOptions={{ itemSize: 38 }}
            className={`${className} ${isInvalid ? 'p-invalid' : ''}`}
            showClear={showClear}
            filter={filter}
            filterPlaceholder={filterPlaceholder}
            emptyFilterMessage={emptyFilterMessage}
            panelClassName={panelClassName}
            ref={dropdownRef}
          />
        }

      {/* Standard MultiSelect */}
      {!radioMode && (mode === "multiselect") && 
          <MultiSelect
            id={id}
            name={name}
            {...commonProps}
            ref={dropdownRef}
            value={selectedValue}
            options={options}
            onChange={(e)=>handleChange(e)}
            onHide={() => {
              setIsTouched(true);
              handleCancelClick();
            }}
            selectAll={selectAll}
            onSelectAll={handleSelectAll}
            // virtualScrollerOptions={{ itemSize: 43 }}
            maxSelectedLabels={maxSelectedLabels}
            className={`${className} ${isInvalid ? 'p-invalid' : ''}`}
            filter={filter}
            display={display}
            panelFooterTemplate={showFooterButtons ? footerTemplate : null}
            optionGroupTemplate={optionGroupTemplate ? optionGroupTemplate : GroupTemplate}
            optionLabel= {optionLabel || "label"} 
            optionGroupChildren={optionGroupChildren} 
            optionGroupLabel={optionGroupLabel}  
            panelClassName={panelClassName} 
            emptyMessage={emptyMessage}         
          />
        }
        
        <div className="dropdown-field-error">{isInvalid && error}</div>
    </div>
  );
};

export default DropdownField;