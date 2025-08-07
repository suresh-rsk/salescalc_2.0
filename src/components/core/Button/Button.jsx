import React, { useEffect } from 'react';
import { Button } from 'primereact/button';
import './Button.css';

/**
 * CustomButton - A wrapper component for PrimeReact Button with predefined variants
 * 
 * @param {string} label - Text to display on the button
 * @param {string} icon - Icon to display (using PrimeReact icon names)
 * @param {string} iconPos - Icon position (left, right)
 * @param {string} severity - Button style (primary, secondary, success, info, warning, help, danger)
 * @param {string} size - Button size (icon, sm, md, lg, xl)
 * @param {boolean} outlined - Whether the button should be outlined
 * @param {boolean} raised - Whether the button should have a raised effect
 * @param {boolean} rounded - Whether the button should have rounded corners
 * @param {boolean} text - Whether the button should be styled as text only
 * @param {boolean} loading - Whether the button should show a loading state
 * @param {boolean} disabled - Whether the button should be disabled
 * @param {function} onClick - Function to call when button is clicked
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 * @param {any} children - Child elements to render inside the button
 * @param {object} rest - Any additional props to pass to the underlying Button component
 */
const ButtonWrapper = ({
  label,
  icon,
  iconPos,
  severity = 'primary',
  size = 'md',
  outlined = false,
  raised = false,
  rounded = false,
  text = false,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  style = {},
  children,
  ...rest
}) => {
  // Define size-specific styling
  const getSizeStyles = () => {
    const baseStyles = {
      icon:{
        width: '2.5rem'
      },
      sm: {
        minWidth: '5rem',
      },
      md: {
        minWidth: '7rem',
      },
      lg: {
        minWidth: '9rem',
      },
      xl: {
        minWidth: '11rem',
      }
    };

    return baseStyles[size] || baseStyles.md;
  };

  // Create internal styles for the button
  const buttonStyles = {
    ...getSizeStyles(),
    ...style,
    transition: 'all 0.2s ease',
  };

  // Define size classes based on the size prop
  const sizeClass = `custom-btn-${size}`;

  // Combine all the classes
  const buttonClasses = [
    className,
    sizeClass,
    'custom-btn',
    disabled ? 'custom-btn-disabled' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <Button
      label={label}
      icon={icon}
      iconPos={iconPos}
      severity={severity}
      outlined={outlined}
      raised={raised}
      rounded={rounded}
      text={text}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      className={buttonClasses}
      style={buttonStyles}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default ButtonWrapper;