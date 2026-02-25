import React from "react";
import { cn } from "@/app/components/ui/utils";
import { Button } from "@/app/components/ui/button";
import { ExternalLink } from "lucide-react";

export type HeroLayout = 'split-bottom' | 'center' | 'left-stack';
export type HeroOverlay = 'dark' | 'light' | 'gradient-heavy' | 'none';

export interface HeroButton {
    id: string;
    label: string;
    link: string;
    newTab: boolean;
    variant: 'primary' | 'secondary';
}

export interface HeroSectionData {
    pretitle: string;
    title: string;
    description: string;
    backgroundImage: string;
    layout: HeroLayout;
    overlay: HeroOverlay;
    buttons: HeroButton[];
}

export const DEFAULT_HERO_DATA: HeroSectionData = {
    pretitle: "Welcome to",
    title: "LA UBF",
    description: "Where people find their community. Where disciples are raised. Where the Word of God is lived.",
    backgroundImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2940&auto=format&fit=crop",
    layout: 'split-bottom',
    overlay: 'gradient-heavy',
    buttons: [
        { id: 'btn-1', label: "I'm New", link: '/new', newTab: false, variant: 'primary' },
        { id: 'btn-2', label: "Upcoming Events", link: '/events', newTab: false, variant: 'secondary' }
    ]
};

interface HeroSectionProps {
    data?: HeroSectionData;
}

export function HeroSection({ data = DEFAULT_HERO_DATA }: HeroSectionProps) {
    const { pretitle, title, description, backgroundImage, layout, overlay, buttons } = data;

    // Overlay Styles
    const overlayStyles = {
        'dark': "bg-black/50",
        'light': "bg-white/20",
        'gradient-heavy': "bg-gradient-to-t from-black/90 via-black/40 to-transparent",
        'none': "bg-transparent"
    };

    // Helper for buttons
    const validButtons = buttons.filter(b => b.label.trim().length > 0).slice(0, 2);

    const renderButtons = () => (
        <div className={cn("flex gap-4 flex-wrap", 
            layout === 'center' ? "justify-center" : "justify-start"
        )}>
            {validButtons.map((btn) => (
                <Button
                    key={btn.id}
                    asChild
                    className={cn(
                        "rounded-full px-8 py-6 text-lg font-bold transition-all duration-200 border",
                        btn.variant === 'primary' 
                            ? "bg-white text-black hover:bg-slate-100 border-transparent"
                            : "bg-transparent text-white border-white hover:bg-white/10"
                    )}
                >
                    <a 
                        href={btn.link} 
                        target={btn.newTab ? "_blank" : undefined}
                        rel={btn.newTab ? "noopener noreferrer" : undefined}
                    >
                        {btn.label}
                    </a>
                </Button>
            ))}
        </div>
    );

    // Layout Content
    const renderContent = () => {
        switch (layout) {
            case 'center':
                return (
                    <div className="flex flex-col items-center justify-center text-center h-full max-w-5xl mx-auto px-6 pb-20 pt-32 gap-8">
                        <div className="space-y-4">
                            <p className="text-2xl md:text-3xl text-white/90 font-medium tracking-wide">{pretitle}</p>
                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic text-white leading-none">
                                {title}
                            </h1>
                        </div>
                        <p className="text-xl md:text-2xl text-white/80 max-w-2xl leading-relaxed">
                            {description}
                        </p>
                        <div className="mt-4">
                            {renderButtons()}
                        </div>
                    </div>
                );
            
            case 'left-stack':
                return (
                    <div className="flex flex-col justify-center h-full max-w-7xl mx-auto px-8 md:px-16 pb-20 pt-32 gap-8">
                        <div className="space-y-2">
                            <p className="text-2xl md:text-4xl text-white/90 font-medium tracking-tight">{pretitle}</p>
                            <h1 className="text-7xl md:text-9xl font-serif italic text-white leading-[0.9]">
                                {title}
                            </h1>
                        </div>
                        <p className="text-xl md:text-2xl text-white/80 max-w-2xl leading-relaxed border-l-4 border-white/30 pl-6">
                            {description}
                        </p>
                        <div className="mt-4">
                            {renderButtons()}
                        </div>
                    </div>
                );

            case 'split-bottom':
            default:
                // Mimicking the exact Figma design structure
                return (
                    <div className="flex flex-col justify-end h-full w-full max-w-[1440px] mx-auto px-6 md:px-16 pb-24 md:pb-32 gap-12">
                        {/* Title Row */}
                        <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">
                            {/* Main Title Block */}
                            <div className="leading-[0.8] text-white tracking-[-0.04em] shrink-0">
                                <p className="text-[40px] md:text-[60px] lg:text-[80px] font-medium mb-0">{pretitle}</p>
                                <p className="font-serif italic text-[80px] md:text-[120px] lg:text-[160px] leading-[0.9]">{title}</p>
                            </div>
                            
                            {/* Description Block - Right Side */}
                            <div className="text-[#ededed] text-lg md:text-2xl lg:text-[32px] tracking-tight max-w-lg leading-tight opacity-90 pb-4">
                                {description}
                            </div>
                        </div>

                        {/* Buttons Row */}
                        <div>
                            {renderButtons()}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="relative w-full h-[80vh] md:h-[90vh] min-h-[600px] overflow-hidden bg-slate-900 group">
            {/* Background Image */}
            <div className="absolute inset-0 select-none">
                <img 
                    src={backgroundImage} 
                    alt="Hero Background" 
                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                />
            </div>

            {/* Overlay */}
            <div className={cn("absolute inset-0 pointer-events-none transition-all duration-500", overlayStyles[overlay])} />

            {/* Content Container */}
            <div className="relative z-10 h-full w-full">
                {renderContent()}
            </div>
        </div>
    );
}
