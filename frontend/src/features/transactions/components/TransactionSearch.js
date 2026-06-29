import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
export const TransactionSearch = ({ onSearch, placeholder = 'Search transactions...', }) => {
    const [query, setQuery] = useState('');
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    }, [onSearch]);
    const handleClear = useCallback(() => {
        setQuery('');
        onSearch('');
    }, [onSearch]);
    return (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx("svg", { className: "h-5 w-5 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }), _jsx("input", { type: "text", value: query, onChange: handleChange, className: "block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-indigo-500 focus:ring-indigo-500", placeholder: placeholder }), query && (_jsx("button", { onClick: handleClear, className: "absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] }));
};
