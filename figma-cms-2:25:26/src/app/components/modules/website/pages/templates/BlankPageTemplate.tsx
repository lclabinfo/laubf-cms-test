"use client";
import { WebsiteNavbar, Page } from "../WebsiteNavbar";
import type { PageSection } from "./HomePageTemplate";
import { SortableSectionWrapper } from "../../SortableSectionWrapper";
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useState } from "react";
import svgPaths from "@/imports/svg-fsvdqh79hz";

function LaubfLogo() {
  return (
    <div className="h-[48px] relative shrink-0 w-[58px]" data-name="laubf-logo">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 58 48">
        <g id="laubf-logo">
          <path d={svgPaths.p3ec03e70} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p3ca1efc0} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

interface BlankPageTemplateProps {
    pages: Page[];
    activePageId?: string;
    onNavigate: (id: string) => void;
    sections?: PageSection[];
    onAddSection?: (index: number, triggerRect?: DOMRect) => void;
    onReorder?: (newSections: PageSection[]) => void;
    onDeleteSection?: (id: string) => void;
    selectedSectionId?: string | null;
    onSelectSection?: (id: string | null) => void;
    onEditSection?: (sectionId: string, type: string, data?: any) => void;
    title: string;
}

export function BlankPageTemplate({ 
    pages, 
    activePageId, 
    onNavigate, 
    sections, 
    onAddSection,
    onReorder,
    onDeleteSection,
    selectedSectionId,
    onSelectSection,
    onEditSection,
    title
}: BlankPageTemplateProps) {
  // Empty default sections for a blank page
  const defaultSections: PageSection[] = [];
  const displaySections = sections || defaultSections;

  const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
      })
  );

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (over && active.id !== over.id) {
          const oldIndex = displaySections.findIndex((s) => s.id === active.id);
          const newIndex = displaySections.findIndex((s) => s.id === over.id);
          
          const newSections = arrayMove(displaySections, oldIndex, newIndex);
          onReorder?.(newSections);
      }
  };

  const renderSectionContent = (section: PageSection) => {
        // Reuse same section renderer or import from a shared utility if possible
        // For now, simple generic
        return (
            <div className="max-w-[1440px] mx-auto px-12 py-20 border-y border-dashed border-slate-200 bg-slate-50/50 my-4 rounded-3xl">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                        <span className="capitalize font-bold text-2xl">{section.type.charAt(0)}</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 capitalize">{section.type} Section</h3>
                    </div>
                </div>
            </div>
        )
  };

  return (
    <div className="bg-white min-h-screen w-full font-['Inter',sans-serif] relative flex flex-col">
       {/* Global Navbar */}
       <WebsiteNavbar 
            pages={pages} 
            activePageId={activePageId} 
            onNavigate={onNavigate} 
            logo={<LaubfLogo />}
            className="w-full bg-white border-b sticky top-0 z-50"
        />

        <div className="flex-1 min-h-[500px] relative">
            {displaySections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                         </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700">Empty Page</h2>
                    <p className="max-w-md text-center mt-2 text-sm">
                        This page is currently empty. Use the <strong>Add Section</strong> tool in the sidebar to start building content.
                    </p>
                </div>
            ) : (
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={displaySections.map(s => s.id)} 
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col pb-20">
                            {displaySections.map((section, index) => (
                                <SortableSectionWrapper
                                    key={section.id}
                                    id={section.id}
                                    isSelected={selectedSectionId === section.id}
                                    onSelect={() => onSelectSection?.(selectedSectionId === section.id ? null : section.id)}
                                    onDelete={() => onDeleteSection?.(section.id)}
                                    onAddBefore={(rect) => onAddSection?.(index, rect)}
                                    onAddAfter={(rect) => onAddSection?.(index + 1, rect)}
                                    onEdit={() => onEditSection?.(section.id, section.type, section.data)}
                                    isFirst={index === 0}
                                >
                                    {renderSectionContent(section)}
                                </SortableSectionWrapper>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
      
      {/* Footer Placeholder */}
      <div className="bg-[#0a0a0a] text-white py-20 px-12 text-center mt-auto">
          <LaubfLogo />
          <p className="mt-8 text-white/50">© 2026 LA UBF. All rights reserved.</p>
      </div>
    </div>
  );
}
