'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FilterOption {
  slug: string;
  libelle: string;
}

interface GenericFilterProps {
  paramName: string;
  label: string;
  placeholder: string;
  allLabel: string;
  tooltipTitle?: string;
  tooltipDescription?: string;
  options: FilterOption[];
  validValues?: string[];
}

export default function GenericFilter({
  paramName,
  label,
  placeholder,
  allLabel,
  tooltipTitle,
  tooltipDescription,
  options,
  validValues,
}: GenericFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selected, setSelected] = useState(searchParams.get(paramName) || 'tous');

  useEffect(() => {
    const current = searchParams.get(paramName) || 'tous';
    if (validValues) {
      setSelected(validValues.includes(current) ? current : 'tous');
    } else {
      setSelected(current);
    }
  }, [searchParams, paramName, validValues]);

  const handleChange = (value: string) => {
    setSelected(value);
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'tous') {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }

    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const isActive = selected !== 'tous';
  const hasTooltip = tooltipTitle && tooltipDescription;

  const trigger = (
    <SelectTrigger
      className={`
        max-w-56 transition-colors duration-200
        ${isActive
          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
          : 'border-input hover:bg-muted hover:border-primary/30'}
      `}
    >
      <SelectValue placeholder={placeholder} />
      {isActive && (
        <span className="ml-2 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
          Actif
        </span>
      )}
    </SelectTrigger>
  );

  const selectContent = (
    <SelectContent>
      <SelectGroup>
        <SelectLabel>{label}</SelectLabel>
        <SelectItem value="tous">{allLabel}</SelectItem>
        {options.map(({ slug, libelle }) => (
          <SelectItem key={slug} value={slug}>
            {libelle}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  );

  if (!hasTooltip) {
    return (
      <Select onValueChange={handleChange} value={selected}>
        {trigger}
        {selectContent}
      </Select>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <Select onValueChange={handleChange} value={selected}>
          <TooltipTrigger asChild>
            {trigger}
          </TooltipTrigger>
          {selectContent}
        </Select>

        <TooltipContent side="bottom" align="start" className="max-w-xs text-base leading-relaxed">
          <p className="font-medium">{tooltipTitle}</p>
          <p className="text-muted-foreground mt-1">{tooltipDescription}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
