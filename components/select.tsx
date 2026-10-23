"use client";

import React, { useEffect, useState } from "react";
import ReactSelect, {
  Props as ReactSelectProps,
  components,
  ControlProps,
  DropdownIndicatorProps,
  ClearIndicatorProps,
  GroupBase,
  StylesConfig,
} from "react-select";
import { Search, ChevronDown, X } from "lucide-react";

// Custom Control with left Search icon
const CustomControl = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>({
  children,
  ...props
}: ControlProps<Option, IsMulti, Group> & { selectProps: { showSearchIcon?: boolean } }) => {
  const showSearchIcon = props.selectProps.showSearchIcon !== false;

  return (
    <components.Control {...props}>
      {showSearchIcon && (
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2.5 pointer-events-none" />
      )}
      {children}
    </components.Control>
  );
};

// Custom Dropdown Indicator
const CustomDropdownIndicator = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(
  props: DropdownIndicatorProps<Option, IsMulti, Group>
) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown
        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 mr-1 ${props.selectProps.menuIsOpen ? "rotate-180" : ""
          }`}
      />
    </components.DropdownIndicator>
  );
};

// Custom Clear Indicator
const CustomClearIndicator = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(
  props: ClearIndicatorProps<Option, IsMulti, Group>
) => {
  return (
    <components.ClearIndicator {...props}>
      <div className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </div>
    </components.ClearIndicator>
  );
};

export function Select<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  showSearchIcon = true,
  hasError = false,
  className = "",
  styles: customStyles,
  components: customComponents,
  placeholder = "Select...",
  noOptionsMessage = () => "No options found",
  isSearchable = true,
  isClearable = true,
  ...props
}: any) {
  // Prevent SSR hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`h-[36px] w-full rounded-[4px] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400 ${className}`}>
        {placeholder}
      </div>
    );
  }

  const defaultStyles: StylesConfig<Option, IsMulti, Group> = {
    control: (base, state) => ({
      ...base,
      minHeight: "36px",
      height: props.isMulti ? "auto" : "36px",
      backgroundColor: "#ffffff",
      borderColor: hasError
        ? "#ef4444"
        : state.isFocused
          ? "#B4395A"
          : "#e2e8f0",
      borderRadius: "4px",
      boxShadow: state.isFocused
        ? hasError
          ? "0 0 0 2px rgba(239, 68, 68, 0.15)"
          : "0 0 0 2px rgba(180, 57, 90, 0.15)"
        : "none",
      "&:hover": {
        borderColor: hasError
          ? "#ef4444"
          : state.isFocused
            ? "#B4395A"
            : "#cbd5e1",
      },
      fontSize: "12px",
      cursor: "pointer",
      transition: "all 0.15s ease",
      padding: props.isMulti ? "2px 0" : "0",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#fff1f2",
      borderRadius: "3px",
      border: "1px solid #fecdd3",
      margin: "2px 4px 2px 0",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#9f1239",
      fontSize: "11px",
      fontWeight: "600",
      padding: "2px 6px",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#9f1239",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#f43f5e",
        color: "#ffffff",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
      fontSize: "12px",
      color: "#1e293b",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      fontSize: "12px",
      color: "#0f172a",
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: "12px",
      color: "#94a3b8",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: "12px",
      color: "#0f172a",
      fontWeight: "500",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#ffffff",
      borderRadius: "4px",
      border: "1px solid #e2e8f0",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
      overflow: "hidden",
      zIndex: 50,
      marginTop: "4px",
      padding: "4px 0",
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
      maxHeight: "220px",
    }),
    option: (base, state) => ({
      ...base,
      fontSize: "12px",
      padding: "8px 12px",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? 0.45 : 1,
      backgroundColor: state.isSelected
        ? "#B4395A"
        : state.isFocused && !state.isDisabled
          ? "#f8fafc"
          : "transparent",
      color: state.isSelected ? "#ffffff" : state.isDisabled ? "#94a3b8" : "#1e293b",
      "&:active": {
        backgroundColor: state.isSelected
          ? "#B4395A"
          : state.isDisabled
            ? "transparent"
            : "#f1f5f9",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      paddingRight: "4px",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      fontSize: "12px",
      color: "#94a3b8",
      padding: "10px 12px",
    }),
  };

  return (
    <ReactSelect
      instanceId="eclera-custom-select"
      openMenuOnFocus={true}
      openMenuOnClick={true}
      isSearchable={isSearchable}
      isClearable={isClearable}
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      className={`text-xs ${className}`}
      styles={{
        ...defaultStyles,
        ...customStyles,
      }}
      components={{
        Control: CustomControl,
        DropdownIndicator: CustomDropdownIndicator,
        ClearIndicator: CustomClearIndicator,
        ...customComponents,
      }}
      {...(props as any)}
    />
  );
}

export default Select;
