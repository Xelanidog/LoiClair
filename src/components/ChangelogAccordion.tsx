"use client"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import MarkdownContent from "@/components/MarkdownContent"

export interface ChangelogSection {
  id: string
  label: string
  content: string
}

export default function ChangelogAccordion({ sections }: { sections: ChangelogSection[] }) {
  return (
    <Accordion type="multiple" defaultValue={sections[0] ? [sections[0].id] : []}>
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id} className="border-none">
          <AccordionTrigger className="text-base font-semibold">
            {section.label}
          </AccordionTrigger>
          <AccordionContent>
            <MarkdownContent content={section.content} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
