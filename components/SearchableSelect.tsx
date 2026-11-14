"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  id?: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  disabled?: boolean;
  emptyMessage?: string;
};

export default function SearchableSelect({
  id: inputId,
  value,
  options,
  onChange,
  placeholder = "Cari nama...",
  ariaLabel,
  disabled = false,
  emptyMessage = "Tidak ada hasil.",
}: SearchableSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const selected = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")),
  );

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  function choose(option: SearchableSelectOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      if (filteredOptions.length) {
        setActiveIndex((index) => {
          if (index < 0) return event.key === "ArrowDown" ? 0 : filteredOptions.length - 1;
          return event.key === "ArrowDown"
            ? (index + 1) % filteredOptions.length
            : (index - 1 + filteredOptions.length) % filteredOptions.length;
        });
      }
      return;
    }
    if (event.key === "Enter" && open && (filteredOptions[activeIndex] || filteredOptions.length === 1)) {
      event.preventDefault();
      choose(filteredOptions[activeIndex] ?? filteredOptions[0]);
    }
  }

  return (
    <div className="searchable-select" ref={rootRef}>
      <input
        type="search"
        id={inputId}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-activedescendant={open && activeIndex >= 0 && filteredOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={open ? query : selected?.label ?? ""}
        onFocus={() => {
          setQuery("");
          setActiveIndex(-1);
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          if (!(event.relatedTarget instanceof Node) || !rootRef.current?.contains(event.relatedTarget)) {
            setOpen(false);
            setQuery("");
          }
        }}
      />
      {value && !disabled && (
        <button
          type="button"
          className="searchable-select-clear"
          aria-label="Hapus pilihan"
          onClick={() => {
            onChange("");
            setQuery("");
            setOpen(true);
          }}
        >
          ×
        </button>
      )}
      {open && !disabled && (
        <div className="searchable-select-options" id={`${id}-options`} role="listbox">
          {filteredOptions.length ? filteredOptions.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-option-${index}`}
              className="searchable-select-option"
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              {option.label}
            </div>
          )) : <div className="searchable-select-empty">{emptyMessage}</div>}
        </div>
      )}
    </div>
  );
}
