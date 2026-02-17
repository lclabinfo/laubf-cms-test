"use client";

import svgPaths from "@/imports/svg-fsvdqh79hz";

const imgImageHbfWinterConference = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwYXVkaWVuY2V8ZW58MXx8fHwxNzY5MTkxMjAxfDA&ixlib=rb-4.1.0&q=80&w=1080";
const imgImageDiscipleshipTrainingProgram = "https://images.unsplash.com/photo-1722962674485-d34e69a9a406?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWJsZSUyMHN0dWR5JTIwZ3JvdXAlMjBkaXNjdXNzaW9ufGVufDF8fHx8MTc2OTE5MTE5NHww&ixlib=rb-4.1.0&q=80&w=1080";
const imgImageSummerRetreat2025Renewal = "https://images.unsplash.com/photo-1643892151836-07fe5562d0f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHJldHJlYXQlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzY5MTA3MDg4fDA&ixlib=rb-4.1.0&q=80&w=1080";
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
import { SortableSectionWrapper } from "../../SortableSectionWrapper";
import { WebsiteNavbar, Page } from "../WebsiteNavbar";
import { SectionType } from "../../SectionPickerModal";
import { BannerSection, BannerSectionData, DEFAULT_BANNER_DATA } from "../../sections/BannerSection";
import { HeroSection, DEFAULT_HERO_DATA } from "../../sections/HeroSection";
import { useState } from "react";

export type PageSection = {
    id: string;
    type: SectionType | 'custom-features' | 'custom-calendar';
    data?: any;
};

function GenericSection({ type }: { type: string }) {
    return (
        <div className="max-w-[1440px] mx-auto px-12 py-20 border-y border-dashed border-slate-200 bg-slate-50/50 my-4 rounded-3xl">
            <div className="flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                    <span className="capitalize font-bold text-2xl">{type.charAt(0)}</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 capitalize">{type} Section</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">This is a newly added section. Configure its content in the settings panel.</p>
                </div>
            </div>
        </div>
    )
}

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

function FeaturedEventsSection() {
    return (
        <div className="max-w-[1440px] mx-auto px-12 py-20">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-[48px] font-medium tracking-tight mb-2">Featured Events</h2>
                    <p className="text-[20px] text-slate-600">Highlights of what's happening in our community.</p>
                </div>
                <button className="pb-1 border-b-2 border-black font-medium text-lg flex items-center gap-2">
                    View All Events
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.16667 10H15.8333" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 4.16667L15.8333 10L10 15.8333" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8 h-[500px]">
                {/* Summer Retreat - Large Item */}
                <div className="col-span-8 relative rounded-[32px] overflow-hidden group cursor-pointer">
                    <img src={imgImageSummerRetreat2025Renewal} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-12 w-full">
                         <h3 className="text-[56px] font-black text-white uppercase leading-[0.9] mb-8 w-[80%]">Summer Retreat 2025: Renewal</h3>
                         <div className="flex gap-4">
                             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 flex items-center gap-3 text-white">
                                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="14" height="14" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="17" y2="10"></line></svg>
                                 <span className="font-medium">Aug 15 @ 5:00 PM</span>
                             </div>
                             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 flex items-center gap-3 text-white">
                                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                 <span className="font-medium">Oak Glen Christian Conference Center</span>
                             </div>
                         </div>
                    </div>
                     <div className="absolute top-8 left-8 bg-[#3667b1] text-white px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase">
                        Featured
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-4 flex flex-col gap-6">
                    {/* HBF Winter Conference */}
                    <div className="flex-1 relative rounded-[32px] overflow-hidden group cursor-pointer bg-[#101828]">
                        <img src={imgImageHbfWinterConference} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-center shadow-sm">
                            <div className="font-bold text-sm leading-none">Dec 28</div>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-white text-[24px] font-black uppercase tracking-wide drop-shadow-md">HBF Winter Conference</h3>
                        </div>
                    </div>

                    {/* Discipleship Training */}
                    <div className="flex-1 relative rounded-[32px] overflow-hidden group cursor-pointer bg-[#101828]">
                        <img src={imgImageDiscipleshipTrainingProgram} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute top-6 left-6">
                             <div className="bg-[#ff6900] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md inline-block mb-3">
                                Program
                             </div>
                             <h3 className="text-white text-[24px] font-black uppercase tracking-wide leading-tight w-[80%]">Discipleship Training Program</h3>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                             <p className="text-white/90 text-sm font-medium line-clamp-2">A comprehensive 12-week program designed to help you grow deeper in your faith and leadership.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CalendarPreview() {
    return (
         <div className="max-w-[1440px] mx-auto px-12 py-10">
            <h2 className="text-[30px] font-bold mb-8">Calendar & Schedule</h2>
            {/* Mock Calendar Content for brevity */}
            <div className="w-full h-[300px] border rounded-xl flex items-center justify-center bg-slate-50 text-slate-400">
                Calendar Component Placeholder
            </div>
         </div>
    )
}

interface HomePageTemplateProps {
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
}

export function HomePageTemplate({ 
    pages, 
    activePageId, 
    onNavigate, 
    sections, 
    onAddSection,
    onReorder,
    onDeleteSection,
    selectedSectionId,
    onSelectSection,
    onEditSection
}: HomePageTemplateProps) {
  // Default sections to preserve existing layout if no state is provided
  const defaultSections: PageSection[] = [
      { id: 'hero-1', type: 'hero', data: DEFAULT_HERO_DATA },
      { id: 'banner-1', type: 'banner', data: DEFAULT_BANNER_DATA },
      { id: 'feat-1', type: 'custom-features' },
      { id: 'cal-1', type: 'custom-calendar' }
  ];

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
      switch(section.type) {
          case 'hero': return <HeroSection key={section.id} data={section.data} />;
          case 'custom-features': return <FeaturedEventsSection key={section.id} />;
          case 'custom-calendar': return <CalendarPreview key={section.id} />;
          case 'banner': return <BannerSection key={section.id} data={section.data} />;
          default: return <GenericSection key={section.id} type={section.type} />;
      }
  };

  return (
    <div className="bg-white min-h-screen w-full font-['Inter',sans-serif] relative">
       {/* Global Navbar */}
       <WebsiteNavbar 
            pages={pages} 
            activePageId={activePageId} 
            onNavigate={onNavigate} 
            logo={<LaubfLogo />}
            className="absolute top-0 left-0 right-0 z-50 w-full"
        />

      <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
      >
          <SortableContext 
              items={displaySections.map(s => s.id)} 
              strategy={verticalListSortingStrategy}
          >
              <div className="flex flex-col">
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
      
      {/* Footer Placeholder */}
      <div className="bg-[#0a0a0a] text-white py-20 px-12 text-center mt-20 relative">
          <LaubfLogo />
          <p className="mt-8 text-white/50">© 2026 LA UBF. All rights reserved.</p>
      </div>
    </div>
  );
}
