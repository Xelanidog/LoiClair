"use client";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function ProcedureTooltip({ label, description }: { label: string; description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="px-2 py-0.5 rounded-md bg-muted font-medium uppercase tracking-wide cursor-help">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" style={{ maxWidth: '18rem', whiteSpace: 'normal', textAlign: 'left', textWrap: 'wrap' }}>
        {description}
      </TooltipContent>
    </Tooltip>
  );
}
