import React, { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { motion, AnimatePresence } from "motion/react";

interface SectionAddTriggerProps {
    onClick: (e: React.MouseEvent, triggerRect: DOMRect) => void;
}

export function SectionAddTrigger({ onClick }: SectionAddTriggerProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            onClick(e, rect);
        }
    };

    return (
        <motion.button
            ref={buttonRef}
            layout
            initial={false}
            animate={{
                width: isHovered ? "auto" : 28,
                paddingLeft: isHovered ? 16 : 0,
                paddingRight: isHovered ? 16 : 0,
            }}
            transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                bounce: 0
            }}
            className={cn(
                "h-7 bg-blue-600 text-white shadow-md flex items-center justify-center overflow-hidden hover:shadow-lg hover:bg-blue-500 rounded-full",
            )}
            style={{ 
                height: "28px",
                minWidth: "28px" 
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            <div className="flex items-center flex-nowrap whitespace-nowrap">
                 <Plus className="w-4 h-4 text-white flex-shrink-0" strokeWidth={3} />
                 
                 <AnimatePresence>
                    {isHovered && (
                        <motion.span
                            key="text"
                            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                            animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs font-semibold uppercase tracking-wide overflow-hidden whitespace-nowrap"
                        >
                            Add Section
                        </motion.span>
                    )}
                 </AnimatePresence>
            </div>
        </motion.button>
    );
}
