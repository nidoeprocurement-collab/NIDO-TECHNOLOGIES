import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextType>({});

export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  disabled,
  children,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        isOpen,
        setIsOpen,
        disabled,
      }}
    >
      <div ref={dropdownRef} {...props} className={`relative w-full ${props.className || ""}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        if (!context.disabled) {
          context.setIsOpen?.(!context.isOpen);
        }
      }}
      disabled={context.disabled}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  const [label, setLabel] = React.useState<string>(placeholder || "");

  React.useEffect(() => {
    if (context.value) {
      const items = document.querySelectorAll("[data-value]");
      items.forEach((item) => {
        if (item.getAttribute("data-value") === context.value) {
          setLabel(item.textContent || "");
        }
      });
    }
  }, [context.value]);

  return (
    <div ref={ref} className={`text-gray-700 ${className || ""}`} {...props}>
      {label || placeholder || children}
    </div>
  );
});
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);

  if (!context.isOpen) return null;

  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg z-50 max-h-60 overflow-y-auto ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, value, children, onClick, ...props }, ref) => {
  const context = React.useContext(SelectContext);

  const handleSelect = () => {
    context.onValueChange?.(value || "");
    context.setIsOpen?.(false);
    onClick?.({} as any);
  };

  const isSelected = context.value === value;

  return (
    <div
      ref={ref}
      onClick={handleSelect}
      className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${isSelected ? "bg-blue-100 font-semibold" : ""} ${className || ""}`}
      data-value={value}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
