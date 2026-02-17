"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { 
    Trash2, 
    Plus, 
    X,
    Upload,
    User,
    Check,
    Database,
    Quote,
    Calendar,
    HelpCircle,
    MapPin
} from "lucide-react";
import { Ministry, WebsiteOverrides } from "@/app/components/modules/church/ministries/data";
import { PersonSelector } from "../../people/PersonSelector";
import { Person } from "../../people/data";

interface SectionEditorProps {
    data: Ministry;
    onUpdate: (field: keyof Ministry, value: any) => void;
    onNestedUpdate: (parent: keyof Ministry, index: number, field: string, value: any) => void;
    sectionId: string;
    onClose: () => void;
}

// Simplified Data Source Banner
const DataSourceBanner = ({ data, sectionId }: { data: Ministry; sectionId: string }) => (
    <div className="bg-gray-50 border-b border-gray-100 px-6 py-2.5 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>
                Source: <span className="font-semibold text-gray-900">{data.name}</span>
                <span className="mx-1 text-gray-300">/</span> 
                {sectionId === 'stories' ? 'Testimonials' : sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}
            </span>
        </div>
        <span className="font-mono text-[10px] opacity-50">ID: {data.id}</span>
    </div>
);

// Extracted component to prevent input focus loss
const SectionTitleEditor = ({ 
    data, 
    sectionId, 
    onUpdateOverride 
}: { 
    data: Ministry; 
    sectionId: string; 
    onUpdateOverride: (key: keyof WebsiteOverrides, val: string) => void 
}) => {
    const getOverrideKey = (id: string): keyof WebsiteOverrides | null => {
        switch(id) {
            case 'hero': return 'heroSectionTitle';
            case 'about': return 'aboutSectionTitle';
            case 'team': return 'teamSectionTitle';
            case 'events': return 'eventsSectionTitle';
            case 'stories': return 'storiesSectionTitle';
            case 'gallery': return 'gallerySectionTitle';
            case 'faq': return 'faqSectionTitle';
            case 'join': return 'joinSectionTitle';
            default: return null;
        }
    };
    
    const overrideKey = getOverrideKey(sectionId);
    
    if (!overrideKey) return null;

    return (
        <div className="space-y-1.5 mb-6 pb-6 border-b border-gray-100">
            <Label className="text-xs font-bold text-gray-700">Section Title (Website Only)</Label>
            <div className="flex gap-2">
                <Input 
                    value={data.websiteOverrides?.[overrideKey] || ""} 
                    onChange={(e) => onUpdateOverride(overrideKey, e.target.value)}
                    className="bg-white border-gray-200 h-9 text-sm"
                    placeholder={`Default: ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`}
                />
            </div>
            <p className="text-[10px] text-gray-500">Overrides the default section heading on the website without changing CMS data.</p>
        </div>
    );
};

export function SectionEditor({ data, onUpdate, onNestedUpdate, sectionId, onClose }: SectionEditorProps) {
    const [isPersonSelectorOpen, setIsPersonSelectorOpen] = useState(false);
    
    // Helper to update the website overrides
    const updateOverride = (field: keyof WebsiteOverrides, value: string) => {
        const currentOverrides = data.websiteOverrides || {};
        onUpdate('websiteOverrides', { ...currentOverrides, [field]: value });
    };

    const handleSelectPerson = (person: Person) => {
        const newLeader = {
            id: `l-${Date.now()}`,
            name: `${person.firstName} ${person.lastName}`,
            role: "Ministry Leader",
            imageUrl: person.photoUrl,
            bio: "",
            socials: [],
            isContactPerson: false
        };
        onUpdate('leaders', [...data.leaders, newLeader]);
    };

    const renderHeader = (title: string, description: string) => (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-500 text-sm mt-1">{description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
            </Button>
        </div>
    );

    const renderCommonWrapper = (children: React.ReactNode) => (
         <div className="bg-white border rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200 w-full max-w-4xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
            <DataSourceBanner data={data} sectionId={sectionId} />
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
         </div>
    );

    const AddButton = ({ onClick, label }: { onClick: () => void, label: string }) => (
        <Button 
            variant="outline" 
            className="w-full border-dashed border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 h-12 mt-6" 
            onClick={onClick}
        >
            <Plus className="w-4 h-4 mr-2" /> {label}
        </Button>
    );

    // TEAM EDITOR
    if (sectionId === 'team') {
        return renderCommonWrapper(
            <>
                {renderHeader("Leadership Team", "Manage ministry leaders and point of contact.")}
                <SectionTitleEditor data={data} sectionId={sectionId} onUpdateOverride={updateOverride} />

                <div className="space-y-4">
                    {data.leaders.map((leader, i) => (
                        <div key={leader.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm relative group">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => onUpdate('leaders', data.leaders.filter(l => l.id !== leader.id))}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex flex-col items-center gap-3 shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden relative group/avatar border border-gray-100">
                                        {leader.imageUrl ? (
                                            <img src={leader.imageUrl} className="w-full h-full object-cover" alt={leader.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <User className="w-10 h-10" />
                                            </div>
                                        )}
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                                        <Upload className="w-3.5 h-3.5" /> Change
                                    </button>
                                </div>
                                <div className="flex-1 w-full space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-700">Name</Label>
                                            <Input 
                                                value={leader.name} 
                                                onChange={(e) => onNestedUpdate('leaders', i, 'name', e.target.value)}
                                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-10"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-700">Role / Title</Label>
                                            <Input 
                                                value={leader.role} 
                                                onChange={(e) => onNestedUpdate('leaders', i, 'role', e.target.value)}
                                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-gray-700">Bio</Label>
                                        <Textarea 
                                            value={leader.bio || ''} 
                                            onChange={(e) => onNestedUpdate('leaders', i, 'bio', e.target.value)}
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-colors min-h-[80px] resize-none"
                                        />
                                    </div>
                                    <div className="border rounded-lg p-3 flex items-start gap-3 bg-white cursor-pointer hover:border-gray-300 transition-colors mt-2">
                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${i === 0 ? 'bg-black border-black text-white' : 'border-gray-300 bg-white'}`}>
                                            {i === 0 && <Check className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-none mb-1">Main Point of Contact</p>
                                            <p className="text-xs text-gray-500">This person will be highlighted as the primary contact.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data.leaders.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                            No leaders added yet. Click "Add Leader" to start.
                        </div>
                    )}
                </div>

                <AddButton label="Add Leader" onClick={() => setIsPersonSelectorOpen(true)} />

                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="h-10 px-6">Cancel</Button>
                    <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 h-10 px-6 text-white font-semibold">Save Changes</Button>
                </div>
                <PersonSelector 
                    isOpen={isPersonSelectorOpen}
                    onClose={() => setIsPersonSelectorOpen(false)}
                    onSelect={handleSelectPerson}
                />
            </>
        );
    }

    // STORIES / TESTIMONIALS EDITOR
    if (sectionId === 'stories') {
        return renderCommonWrapper(
            <>
                {renderHeader("Student Stories", "Manage testimonials and stories from students.")}
                <SectionTitleEditor data={data} sectionId={sectionId} onUpdateOverride={updateOverride} />

                <div className="space-y-4">
                    {data.testimonials.map((testimonial, i) => (
                        <div key={testimonial.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm relative group">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => onUpdate('testimonials', data.testimonials.filter(t => t.id !== testimonial.id))}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            <div className="flex gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border">
                                    {testimonial.imageUrl ? (
                                        <img src={testimonial.imageUrl} alt={testimonial.author} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <Quote className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <Label className="text-xs font-bold text-gray-700">Image URL</Label>
                                    <Input 
                                        value={testimonial.imageUrl || ''}
                                        onChange={(e) => onNestedUpdate('testimonials', i, 'imageUrl', e.target.value)}
                                        className="bg-gray-50 border-gray-200 h-9" 
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Student Name</Label>
                                    <Input 
                                        value={testimonial.author}
                                        onChange={(e) => onNestedUpdate('testimonials', i, 'author', e.target.value)}
                                        className="bg-gray-50 border-gray-200 h-9" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Role / Year</Label>
                                    <Input 
                                        value={testimonial.role || ''}
                                        onChange={(e) => onNestedUpdate('testimonials', i, 'role', e.target.value)}
                                        className="bg-gray-50 border-gray-200 h-9" 
                                        placeholder="e.g. Freshman"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">Quote Content</Label>
                                <Textarea 
                                    value={testimonial.content}
                                    onChange={(e) => onNestedUpdate('testimonials', i, 'content', e.target.value)}
                                    className="bg-gray-50 border-gray-200 min-h-[100px]" 
                                    placeholder="What does the student say about the ministry?"
                                />
                            </div>
                        </div>
                    ))}
                    {data.testimonials.length === 0 && (
                         <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                            No stories added yet. Click "Add Story" to start.
                        </div>
                    )}
                </div>

                <AddButton 
                    label="Add Story" 
                    onClick={() => {
                        const newTestimonial = {
                            id: `t-${Date.now()}`,
                            author: "New Student",
                            role: "Student",
                            content: "",
                            imageUrl: ""
                        };
                        onUpdate('testimonials', [...data.testimonials, newTestimonial]);
                    }} 
                />

                 <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="h-10 px-6">Cancel</Button>
                    <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 h-10 px-6 text-white font-semibold">Save Changes</Button>
                </div>
            </>
        );
    }

    // FAQ EDITOR
    if (sectionId === 'faq') {
        return renderCommonWrapper(
             <>
                {renderHeader("FAQ", "Manage frequently asked questions.")}
                <SectionTitleEditor data={data} sectionId={sectionId} onUpdateOverride={updateOverride} />

                <div className="space-y-4">
                    {data.faqs.map((faq, i) => (
                        <div key={faq.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm relative group">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => onUpdate('faqs', data.faqs.filter(f => f.id !== faq.id))}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                        <HelpCircle className="w-3 h-3" /> Question
                                    </Label>
                                    <Input 
                                        value={faq.question}
                                        onChange={(e) => onNestedUpdate('faqs', i, 'question', e.target.value)}
                                        className="bg-gray-50 border-gray-200 h-10 font-medium" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Answer</Label>
                                    <Textarea 
                                        value={faq.answer}
                                        onChange={(e) => onNestedUpdate('faqs', i, 'answer', e.target.value)}
                                        className="bg-gray-50 border-gray-200 min-h-[100px]" 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                     {data.faqs.length === 0 && (
                         <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                            No FAQs added yet. Click "Add Question" to start.
                        </div>
                    )}
                </div>

                <AddButton 
                    label="Add Question" 
                    onClick={() => {
                        const newFaq = {
                            id: `f-${Date.now()}`,
                            question: "New Question?",
                            answer: ""
                        };
                        onUpdate('faqs', [...data.faqs, newFaq]);
                    }} 
                />

                 <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="h-10 px-6">Cancel</Button>
                    <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 h-10 px-6 text-white font-semibold">Save Changes</Button>
                </div>
            </>
        );
    }

    // JOIN US / MEETINGS EDITOR
    if (sectionId === 'join') {
        return renderCommonWrapper(
             <>
                {renderHeader("Join Us", "Manage meeting times and locations.")}
                <SectionTitleEditor data={data} sectionId={sectionId} onUpdateOverride={updateOverride} />

                <div className="space-y-4">
                    {data.meetings.map((meeting, i) => (
                        <div key={meeting.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm relative group">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => onUpdate('meetings', data.meetings.filter(m => m.id !== meeting.id))}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Label</Label>
                                    <Input 
                                        value={meeting.label}
                                        onChange={(e) => onNestedUpdate('meetings', i, 'label', e.target.value)}
                                        className="bg-gray-50 border-gray-200 h-9" 
                                        placeholder="e.g. Bible Study"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Type</Label>
                                    <select 
                                        value={meeting.type}
                                        onChange={(e) => onNestedUpdate('meetings', i, 'type', e.target.value)}
                                        className="w-full h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm shadow-sm transition-colors focus:bg-white"
                                    >
                                        <option value="in-person">In Person</option>
                                        <option value="online">Online</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Day & Time
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={meeting.day}
                                            onChange={(e) => onNestedUpdate('meetings', i, 'day', e.target.value)}
                                            className="bg-gray-50 border-gray-200 h-9 w-1/2" 
                                            placeholder="Day"
                                        />
                                        <Input 
                                            value={meeting.time}
                                            onChange={(e) => onNestedUpdate('meetings', i, 'time', e.target.value)}
                                            className="bg-gray-50 border-gray-200 h-9 w-1/2" 
                                            placeholder="Time"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Location
                                    </Label>
                                    <Input 
                                        value={meeting.location}
                                        onChange={(e) => onNestedUpdate('meetings', i, 'location', e.target.value)}
                                        className="bg-gray-50 border-gray-200 h-9" 
                                        placeholder="e.g. Student Center"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                     {data.meetings.length === 0 && (
                         <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                            No meetings/events added yet. Click "Add Meeting" to start.
                        </div>
                    )}
                </div>

                <AddButton 
                    label="Add Meeting" 
                    onClick={() => {
                        const newMeeting = {
                            id: `m-${Date.now()}`,
                            label: "Bible Study",
                            location: "TBA",
                            day: "Wednesday",
                            time: "7:00 PM",
                            type: "in-person" as const
                        };
                        onUpdate('meetings', [...data.meetings, newMeeting]);
                    }} 
                />

                 <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="h-10 px-6">Cancel</Button>
                    <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 h-10 px-6 text-white font-semibold">Save Changes</Button>
                </div>
            </>
        );
    }

    // GENERAL / HERO / ABOUT (Default fallback)
    return renderCommonWrapper(
        <>
            {renderHeader(
                sectionId === 'hero' ? 'Header & Hero' : 
                sectionId === 'about' ? 'About Section' : 
                `Edit ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`, 
                "Update content for this section."
            )}
            
            <SectionTitleEditor 
                data={data} 
                sectionId={sectionId} 
                onUpdateOverride={updateOverride} 
            />
            
            <div className="space-y-6 max-w-2xl">
                {sectionId === 'hero' && (
                    <>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">Ministry Name</Label>
                            <Input 
                                value={data.name} 
                                onChange={(e) => onUpdate('name', e.target.value)}
                                className="bg-gray-50 border-gray-200 h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">Subtitle</Label>
                            <Input 
                                value={data.heroSubtitle || ''} 
                                onChange={(e) => onUpdate('heroSubtitle', e.target.value)}
                                className="bg-gray-50 border-gray-200 h-10"
                                placeholder="e.g. True Vine Club"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">Hero Description</Label>
                            <Textarea 
                                value={data.heroDescription || ''} 
                                onChange={(e) => onUpdate('heroDescription', e.target.value)}
                                className="bg-gray-50 border-gray-200 min-h-[80px]"
                                placeholder="e.g. Jesus is the true vine..."
                            />
                        </div>
                         <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">Banner Image URL</Label>
                            <Input 
                                value={data.bannerImage || ''} 
                                onChange={(e) => onUpdate('bannerImage', e.target.value)}
                                className="bg-gray-50 border-gray-200 h-10"
                            />
                        </div>
                    </>
                )}

                {sectionId === 'about' && (
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700">Description</Label>
                        <Textarea 
                            value={data.description} 
                            onChange={(e) => onUpdate('description', e.target.value)}
                            className="bg-gray-50 border-gray-200 min-h-[300px]"
                            placeholder="Enter the full about text here..."
                        />
                    </div>
                )}
                
                {!['hero', 'about'].includes(sectionId) && (
                     <p className="text-gray-500 text-sm">
                        This section does not have a dedicated inline editor yet.
                     </p>
                )}
            </div>

            <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={onClose} className="h-10 px-6">Cancel</Button>
                <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 h-10 px-6 text-white font-semibold">Save Changes</Button>
            </div>
        </>
    );
}
