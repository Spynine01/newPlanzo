import React from 'react';

export const Input = ({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  error,
  id,
  name,
  required = false,
  disabled = false
}) => {
  const baseStyles = 'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200';
  const errorStyles = error ? 'border-red-500' : 'border-gray-300';
  const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';

  return (
    <div className="w-full">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${baseStyles} ${errorStyles} ${disabledStyles} ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}; 