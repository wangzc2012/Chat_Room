import { useMemo, useState, useEffect } from "react";

export type SelectProps = {
    options: {
        label: string;
        value: any;
    }[];
    placeholder?: string;
    defaultValue?: any;
    className?: string;
    onChange?: (value: any) => void;
}
export const BaseSelect = ({options, defaultValue, className, onChange = () => {}, placeholder = ''}: SelectProps)=>{
    const [selectedValue, setSelectedValue] = useState<any>();
    const isArrayOrObject = options.find((option)=>{
        return typeof option.value === 'object' || Array.isArray(option.value);
    });

    useEffect(() => {
        const d = defaultValue || (options.length ? options[0].value : undefined);
        const formattedValue = isArrayOrObject && d ? JSON.stringify(d) : d;
        setSelectedValue(formattedValue);
    }, [defaultValue]);

    return (
        <select 
            value={selectedValue}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>{
                let value = e.target.value;
                let valueStr = value
                if(typeof value === 'object' || Array.isArray(value)){
                    valueStr = JSON.stringify(value);
                }
                setSelectedValue(valueStr);
                if(typeof value === 'string'){
                    value = JSON.parse(value);
                }
                onChange(value);
            }}
            className={`select ${className}`}
        >
            {
                placeholder &&
                <option disabled={true}>{placeholder}</option>
            }
            {
                options.map((option)=>{
                    return <option key={option.label} value={isArrayOrObject ? JSON.stringify(option.value) : option.value}>{option.label}</option> 
                })
            }
        </select>
    )
}