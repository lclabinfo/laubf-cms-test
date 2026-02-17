import React from "react";
import { cn } from "@/app/components/ui/utils";
import { ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export type BannerColorScheme = 'dark' | 'light' | 'blue' | 'navy';
export type BannerHeight = 'default' | 'sm' | 'md' | 'lg' | 'full';
export type BannerAlignment = 'left' | 'center' | 'right';

export interface BannerButton {
    id: string;
    label: string;
    link: string;
    newTab: boolean;
    variant: 'primary' | 'secondary';
}

export interface BannerSectionData {
    title: string;
    description: string;
    colorScheme: BannerColorScheme;
    height: BannerHeight;
    alignment: BannerAlignment;
    buttons: BannerButton[];
}

export const DEFAULT_BANNER_DATA: BannerSectionData = {
    title: "A Christian Ministry for College Students",
    description: "University Bible Fellowship (UBF) is an international, non-denominational evangelical church centered on Bible study and discipleship. We especially serve college students, raising lifelong disciples of Jesus Christ who love one another and take part in God’s global mission.",
    colorScheme: 'dark',
    height: 'default',
    alignment: 'center',
    buttons: [
        { id: 'btn-1', label: "I'm New", link: '/new', newTab: false, variant: 'primary' },
        { id: 'btn-2', label: "About Us", link: '/about', newTab: false, variant: 'secondary' }
    ]
};

interface BannerSectionProps {
    data?: BannerSectionData;
}

export function BannerSection({ data = DEFAULT_BANNER_DATA }: BannerSectionProps) {
    const { title, description, colorScheme, height, alignment, buttons } = data;

    // Color Styles
    const colorStyles = {
        dark: "bg-[#0d0d0d] text-white",
        light: "bg-white text-slate-900 border-y border-slate-100",
        blue: "bg-blue-600 text-white",
        navy: "bg-slate-900 text-white"
    };

    // Height Styles
    const heightStyles = {
        default: "py-[80px]",
        sm: "py-12",
        md: "py-24",
        lg: "py-32",
        full: "min-h-[80vh] flex items-center"
    };

    // Alignment Styles
    const alignStyles = {
        left: "items-start text-left",
        center: "items-center text-center",
        right: "items-end text-right"
    };

    // Button Styles (Dynamic based on background)
    const isLightBg = colorScheme === 'light';
    
    const getBtnStyles = (variant: 'primary' | 'secondary') => {
        if (variant === 'primary') {
            return isLightBg 
                ? "bg-slate-900 text-white hover:bg-slate-800 border-transparent shadow-md" 
                : "bg-white text-[#0d0d0d] hover:bg-slate-100 border-transparent shadow-md";
        } else {
            return isLightBg
                ? "bg-white text-slate-900 border-slate-200 hover:bg-slate-50 shadow-sm"
                : "bg-transparent text-white border-white hover:bg-white/10";
        }
    };

    // Filter valid buttons
    const validButtons = buttons.filter(b => b.label.trim().length > 0).slice(0, 2);

    return (
        <div className={cn(
            "w-full px-6 md:px-12 flex flex-col justify-center transition-all duration-300",
            colorStyles[colorScheme],
            heightStyles[height],
            alignStyles[alignment]
        )}>
            <div className={cn(
                "w-full max-w-4xl mx-auto flex flex-col gap-6",
                alignStyles[alignment]
            )}>
                <h2 className="text-3xl md:text-[40px] font-medium leading-tight tracking-tight">
                    {title}
                </h2>
                
                <p className={cn(
                    "text-lg md:text-[20px] leading-relaxed max-w-3xl opacity-90",
                    // Use standard fonts to match design roughly
                    "font-sans" 
                )}>
                    {description}
                </p>

                {validButtons.length > 0 && (
                    <div className={cn("flex gap-4 mt-4 flex-wrap", alignment === 'center' && "justify-center", alignment === 'right' && "justify-end")}>
                        {validButtons.map((btn) => (
                            <Button
                                key={btn.id}
                                asChild
                                className={cn(
                                    "rounded-full px-8 py-6 text-lg font-bold transition-all duration-200",
                                    getBtnStyles(btn.variant)
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
                )}
            </div>
        </div>
    );
}
