import React, { useState, useEffect, useRef } from "react";
import { Ministry } from "@/app/components/modules/church/ministries/data";
import { MapPin, Clock, Mail, Instagram, Globe, ChevronRight, ChevronDown, Calendar, ArrowRight, Edit3, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

// Import assets from the design
const heroImage = "https://images.unsplash.com/photo-1662151808629-029b89ce5339?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwc2VydmljZXxlbnwxfHx8fDE3NjkxMjA2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080";

import { WebsiteNavbar, Page } from "../WebsiteNavbar";
import { SectionEditor } from "../SectionEditor";

interface MinistryPageTemplateProps {
    data: Ministry;
    onUpdate: (field: keyof Ministry, value: any) => void;
    onNestedUpdate: (parent: keyof Ministry, index: number, field: string, value: any) => void;
    pages: Page[];
    activePageId?: string;
    onNavigate: (id: string) => void;
}

// Extracted wrapper component to prevent re-renders losing focus
interface SectionWrapperProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    editingSectionId: string | null;
    hiddenSections: string[];
    setEditingSectionId: (id: string | null) => void;
    toggleSectionVisibility: (id: string) => void;
    data: Ministry;
    onUpdate: (field: keyof Ministry, value: any) => void;
    onNestedUpdate: (parent: keyof Ministry, index: number, field: string, value: any) => void;
    isHero?: boolean; // Flag to determine if this is a hero section
}

function SectionWrapper({ 
    id, 
    children, 
    className, 
    editingSectionId, 
    hiddenSections, 
    setEditingSectionId, 
    toggleSectionVisibility,
    data,
    onUpdate,
    onNestedUpdate,
    isHero = false
}: SectionWrapperProps) {
    const isEditing = editingSectionId === id;
    const isHidden = hiddenSections.includes(id);
    const containerRef = useRef<HTMLDivElement>(null);
    const [wasEditing, setWasEditing] = useState(false);

    // Scroll to section when editing finishes
    useEffect(() => {
        if (wasEditing && !isEditing) {
            requestAnimationFrame(() => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const headerOffset = 120;
                const isAbove = rect.top < headerOffset;
                const isBelow = rect.top > window.innerHeight - 100;
                if (isAbove || isBelow) {
                    const targetScroll = window.scrollY + rect.top - headerOffset;
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }
            });
        }
        setWasEditing(isEditing);
    }, [isEditing, wasEditing]);

    if (isEditing) {
        return (
            <div className={cn("my-8 relative z-20", className)}>
                <SectionEditor 
                    data={data} 
                    onUpdate={onUpdate}
                    onNestedUpdate={onNestedUpdate}
                    sectionId={id} 
                    onClose={() => setEditingSectionId(null)} 
                />
            </div>
        );
    }

    if (isHidden) {
        return (
            <div ref={containerRef} className="border border-dashed border-gray-300 rounded-lg p-4 my-4 flex items-center justify-between bg-gray-50 opacity-60 group">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    {id.charAt(0).toUpperCase() + id.slice(1)} Section (Hidden)
                </span>
                <Button variant="outline" size="sm" onClick={() => toggleSectionVisibility(id)}>Show</Button>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className={cn(
                "relative group transition-all duration-200", 
                className
            )}
        >
            {/* Floating Action Menu - visible on hover */}
            {/* MODIFIED: Positioned at bottom-right and simplified options */}
            <div className={cn(
                "absolute z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                isHero ? "bottom-8 right-8" : "top-4 right-4"
            )}>
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex flex-col min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
                    <Button 
                        variant="ghost" 
                        className="justify-start h-9 px-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full"
                        onClick={(e) => { e.stopPropagation(); setEditingSectionId(id); }}
                    >
                        <Edit3 className="w-4 h-4 mr-2 text-gray-500" /> 
                        {isHero ? "Edit Header" : "Edit Content"}
                    </Button>
                    
                    {/* Hide Section is REMOVED for Hero, kept for others if needed, but user asked to remove "Hide Section" for mandatory things */}
                    {!isHero && (
                        <Button 
                            variant="ghost" 
                            className="justify-start h-9 px-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full"
                            onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(id); }}
                        >
                            <EyeOff className="w-4 h-4 mr-2 text-gray-500" /> Hide Section
                        </Button>
                    )}
                </div>
            </div>

            {/* Blue border on hover to indicate selection area */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-600 pointer-events-none rounded-lg z-10 transition-colors duration-200" />
            
            {children}
        </div>
    );
}

export function MinistryPageTemplate({ data, onUpdate, onNestedUpdate, pages, activePageId, onNavigate }: MinistryPageTemplateProps) {
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [hiddenSections, setHiddenSections] = useState<string[]>([]);
    const [openFaqId, setOpenFaqId] = useState<string | null>(null);

    const toggleSectionVisibility = (id: string) => {
        setHiddenSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const wrapperProps = {
        editingSectionId,
        hiddenSections,
        setEditingSectionId,
        toggleSectionVisibility,
        data,
        onUpdate,
        onNestedUpdate
    };

    return (
        <div className="bg-white min-h-screen font-sans text-[#101828] w-full mx-auto relative">
             <WebsiteNavbar 
                pages={pages} 
                activePageId={activePageId} 
                onNavigate={onNavigate} 
                className="absolute top-0 left-0 right-0 z-50"
            />
            {/* Hero Section */}
            <SectionWrapper id="hero" className="relative h-[400px] w-full overflow-hidden" isHero={true} {...wrapperProps}>
                <div className="absolute inset-0">
                     <img 
                        src={data.bannerImage || heroImage} 
                        alt={data.name} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-10">
                     <div className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded mb-4 uppercase tracking-wider">
                        {data.id.toUpperCase()} Ministry
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-md">
                        {data.name} <span className="text-white/90">{data.heroSubtitle || "True Vine Club"}</span>
                    </h1>
                    <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl drop-shadow">
                        {data.heroDescription || "Jesus is the true vine and we are his branches."}
                    </p>
                </div>
            </SectionWrapper>

            <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Content Column */}
                <div className="lg:col-span-8 space-y-20">
                    
                    {/* About Us */}
                    <SectionWrapper id="about" {...wrapperProps}>
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-3xl font-black uppercase tracking-tight">{data.websiteOverrides?.aboutSectionTitle || "About Us"}</h2>
                            <div className="h-1 flex-1 bg-gray-100 rounded-full" />
                        </div>
                        <div className="space-y-6">
                            {data.description.split('\n').map((paragraph, idx) => {
                                if (paragraph.trim().startsWith('"')) {
                                    return <p key={idx} className="font-serif italic text-gray-600 text-lg">{paragraph}</p>;
                                }
                                if (!paragraph.trim()) return <br key={idx} />;
                                return <p key={idx} className="font-serif text-gray-600 leading-relaxed text-lg">{paragraph}</p>;
                            })}
                        </div>
                    </SectionWrapper>

                    {/* Meet The Team */}
                    <SectionWrapper id="team" {...wrapperProps}>
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black uppercase tracking-tight">{data.websiteOverrides?.teamSectionTitle || "Meet the Team"}</h2>
                            <div className="h-1 flex-1 bg-gray-100 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data.leaders.map((leader) => (
                                <div key={leader.id} className="flex gap-4 items-start group/card">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-gray-100">
                                        <img src={leader.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`} alt={leader.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900">{leader.name}</h3>
                                        <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">{leader.role}</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">{leader.bio || "Serving our campus ministry to help students grow in faith."}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionWrapper>

                    {/* Upcoming Events */}
                    <SectionWrapper id="events" {...wrapperProps}>
                        <div className="flex items-center justify-between mb-8">
                             <div className="flex items-center gap-4 flex-1 mr-8">
                                <h2 className="text-3xl font-black uppercase tracking-tight whitespace-nowrap">{data.websiteOverrides?.eventsSectionTitle || "Upcoming Events"}</h2>
                                <div className="h-1 flex-1 bg-gray-100 rounded-full" />
                            </div>
                            <Button variant="link" className="text-blue-600 font-bold uppercase text-xs tracking-wider gap-1 p-0 h-auto">
                                View All Events <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video w-full bg-gray-100 relative">
                                <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1000&auto=format&fit=crop" alt="Club Rush" className="w-full h-full object-cover" />
                                <div className="absolute top-4 left-4 bg-white/95 rounded-lg p-2 text-center min-w-[50px] shadow-sm border">
                                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Sep</div>
                                    <div className="text-xl font-black text-gray-900 leading-none">10</div>
                                </div>
                                <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                    YAM
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 11:00 AM</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> LBCC Quad</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">True Vine Club Rush</h3>
                                <p className="text-gray-500 text-sm mb-6">Meet the club members and learn about our bible studies.</p>
                                <div className="pt-4 border-t">
                                    <button className="text-blue-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                        Learn More <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SectionWrapper>

                    {/* Student Stories */}
                    <SectionWrapper id="stories" {...wrapperProps}>
                         <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black uppercase tracking-tight">{data.websiteOverrides?.storiesSectionTitle || "Student Stories"}</h2>
                            <div className="h-1 flex-1 bg-gray-100 rounded-full" />
                        </div>
                        {data.testimonials.length > 0 ? (
                            data.testimonials.map((testimonial) => (
                                <div key={testimonial.id} className="bg-gray-50 rounded-3xl p-8 relative mb-6 last:mb-0">
                                    <span className="text-6xl text-blue-200 font-serif absolute top-4 left-6 leading-none">"</span>
                                    <blockquote className="relative z-10 pl-4 pt-4 mb-6">
                                        <p className="font-serif italic text-xl text-gray-700 leading-relaxed">
                                            {testimonial.content}
                                        </p>
                                    </blockquote>
                                    <div className="flex items-center gap-3 pl-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                                            {testimonial.imageUrl ? (
                                                <img src={testimonial.imageUrl} className="w-full h-full object-cover" alt={testimonial.author} />
                                            ) : (
                                                testimonial.author.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{testimonial.author}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="bg-gray-50 rounded-3xl p-8 text-center text-gray-500">
                                 No testimonials added yet.
                             </div>
                        )}
                    </SectionWrapper>

                     {/* Gallery */}
                    <SectionWrapper id="gallery" {...wrapperProps}>
                         <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black uppercase tracking-tight">{data.websiteOverrides?.gallerySectionTitle || `Life at ${data.name}`}</h2>
                            <div className="h-1 flex-1 bg-gray-100 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-[500px]">
                             <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden">
                                 <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="Life 1" />
                             </div>
                             <div className="rounded-2xl overflow-hidden">
                                 <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="Life 2" />
                             </div>
                             <div className="rounded-2xl overflow-hidden">
                                 <img src="https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&q=80" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="Life 3" />
                             </div>
                        </div>
                    </SectionWrapper>
                    
                     {/* FAQ */}
                    <SectionWrapper id="faq" {...wrapperProps}>
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black uppercase tracking-tight">{data.websiteOverrides?.faqSectionTitle || "FAQ"}</h2>
                            <div className="h-1 flex-1 bg-gray-100 rounded-full" />
                        </div>
                        <div className="space-y-4">
                            {data.faqs.length > 0 ? data.faqs.map((faq) => (
                                <div key={faq.id} className="border-b pb-4">
                                    <div 
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                                    >
                                        <h3 className={cn(
                                            "font-bold text-lg transition-colors",
                                            openFaqId === faq.id ? "text-blue-600" : "text-gray-900 group-hover:text-blue-600"
                                        )}>{faq.question}</h3>
                                        <ChevronDown className={cn(
                                            "w-5 h-5 text-gray-400 transition-transform",
                                            openFaqId === faq.id && "rotate-180 text-blue-600"
                                        )} />
                                    </div>
                                    <div className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        openFaqId === faq.id ? "max-h-[200px] opacity-100 mt-2" : "max-h-0 opacity-0"
                                    )}>
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-gray-500 italic">No FAQs added yet.</div>
                            )}
                        </div>
                    </SectionWrapper>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <SectionWrapper id="join" {...wrapperProps} className="sticky top-8">
                        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] p-8 border border-gray-100">
                             <h3 className="text-xl font-black uppercase tracking-tight mb-6">{data.websiteOverrides?.joinSectionTitle || "Join Us"}</h3>
                             
                             <div className="space-y-4 mb-8">
                                 {data.meetings.length > 0 ? data.meetings.map((meeting) => (
                                     <div key={meeting.id} className="bg-gray-50 rounded-xl p-4">
                                         <div className="flex gap-3 mb-2">
                                             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                 <Clock className="w-4 h-4 text-blue-600" />
                                             </div>
                                             <div>
                                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">When</div>
                                                 <div className="font-bold text-sm text-gray-900">{meeting.day}s @ {meeting.time}</div>
                                             </div>
                                         </div>
                                          <div className="flex gap-3">
                                             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                 <MapPin className="w-4 h-4 text-blue-600" />
                                             </div>
                                             <div>
                                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Where</div>
                                                 <div className="font-bold text-sm text-gray-900">{meeting.location}</div>
                                             </div>
                                         </div>
                                         {(meeting.label.toLowerCase().includes('food') || meeting.id === 'm1') && (
                                            <div className="mt-3 ml-11 inline-block bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded">
                                                Food provided! 🍕
                                            </div>
                                         )}
                                     </div>
                                 )) : (
                                     <div className="text-sm text-gray-500 italic">No meeting times configured.</div>
                                 )}
                             </div>

                             <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Contact</div>
                                    <div className="font-bold text-sm text-gray-900">lbcc@laubf.org</div>
                                </div>
                             </div>

                             <div className="space-y-3">
                                 <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 uppercase tracking-wide text-xs">
                                     Start Bible Study <ArrowRight className="ml-2 w-4 h-4" />
                                 </Button>
                                 <Button variant="outline" className="w-full font-bold h-12 uppercase tracking-wide text-xs border-gray-200 hover:bg-gray-50">
                                     <Instagram className="mr-2 w-4 h-4" /> Follow on Instagram
                                 </Button>
                                 <Button variant="ghost" className="w-full font-bold h-12 uppercase tracking-wide text-xs hover:bg-gray-50">
                                     <Globe className="mr-2 w-4 h-4" /> Visit Website
                                 </Button>
                             </div>
                        </div>
                    </SectionWrapper>
                </div>
            </div>

            {/* Footer / Other Ministries */}
            <div className="bg-[#0f172a] py-16 px-6">
                <div className="max-w-[1200px] mx-auto text-center">
                    <h3 className="text-white font-black uppercase tracking-tight text-xl mb-12">Explore Other Ministries</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['CSULB', 'UCLA', 'USC', 'CSUF', 'UCI', 'UCSD', 'Berkeley', 'Davis'].map(campus => (
                            <div key={campus} className="border border-white/20 text-white/60 hover:text-white hover:border-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer transition-all">
                                {campus}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
