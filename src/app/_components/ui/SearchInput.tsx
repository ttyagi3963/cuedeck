"use client";

import { useState, useEffect } from "react";
import Input from "@/app/_components/ui/Input";
import { useDebounce } from "@/hooks/useDebounce";

type SearchInputProps = {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
};

export default function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
