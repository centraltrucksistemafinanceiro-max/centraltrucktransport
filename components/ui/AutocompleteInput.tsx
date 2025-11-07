import React from 'react';

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  suggestions: string[];
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ label, id, suggestions, ...props }) => {
  const dataListId = `${id}-suggestions`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          list={dataListId}
          {...props}
          className="block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <datalist id={dataListId}>
          {suggestions.map((suggestion, index) => (
            <option key={index} value={suggestion} />
          ))}
        </datalist>
      </div>
    </div>
  );
};
