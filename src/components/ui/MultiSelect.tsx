import { useState, useEffect, useRef, type FC } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ... label ... */}
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>

      <div
        className={cn(
          "min-h-9.5 w-full bg-white/80 backdrop-blur-sm border rounded-lg px-2 py-1 cursor-pointer flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md",
          isOpen
            ? "border-accent-primary ring-2 ring-accent-primary/20"
            : "border-gray-200 hover:border-accent-primary/50",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 && (
            <span className="text-gray-400 text-sm px-1">{placeholder}</span>
          )}
          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent-light text-accent-primary"
            >
              {value}
              <X
                className="ml-1 w-3 h-3 cursor-pointer hover:text-accent-primary/80"
                onClick={(e) => removeOption(value, e)}
              />
            </span>
          ))}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden py-1 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-accent-primary"
              placeholder="Search..."
              autoFocus
              value={searchTerm}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto max-h-60">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer flex items-center hover:bg-gray-50",
                    selected.includes(option) &&
                      "bg-accent-light/50 text-accent-primary font-medium",
                  )}
                  onClick={() => toggleOption(option)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 border rounded mr-2 flex items-center justify-center transition-colors",
                      selected.includes(option) &&
                        "bg-accent-primary border-accent-primary",
                      !selected.includes(option) && "border-gray-300",
                    )}
                  >
                    {selected.includes(option) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
