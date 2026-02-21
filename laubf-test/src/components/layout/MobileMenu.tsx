"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, SquareArrowOutUpRight, ArrowUpRight } from "lucide-react";
import { dropdowns, directLinks } from "./nav-data";
import { IconClose } from "./icons";
import CTAButton from "@/components/shared/CTAButton";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleSection = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const menu = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[9998] bg-black-1/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed inset-y-0 right-0 z-[9999] w-full max-w-sm bg-white-0 transition-transform duration-300 ease-smooth h-[100svh] flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white-2">
          <Link href="/" onClick={onClose}>
            <Image
              src="/logo/laubf-logo-blue.svg"
              alt="LA UBF"
              width={50}
              height={42}
              unoptimized
              className="object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-black-1"
            aria-label="Close menu"
          >
            <IconClose width={24} height={24} />
          </button>
        </div>

        {/* Nav sections */}
        <div className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto">
          {dropdowns.map((dropdown) => (
            <div key={dropdown.id}>
              {/* Accordion header */}
              <button
                onClick={() => toggleSection(dropdown.id)}
                className="flex items-center justify-between w-full px-4 py-4 rounded-lg text-nav text-black-1 transition-colors duration-150 hover:bg-white-1-5"
              >
                {dropdown.label}
                <ChevronDown
                  className={cn(
                    "size-5 transition-transform duration-200",
                    expanded === dropdown.id && "rotate-180",
                  )}
                  strokeWidth={2}
                />
              </button>

              {/* Accordion content */}
              <div
                className={cn(
                  "overflow-hidden transition-[grid-template-rows] duration-300 ease-smooth grid",
                  expanded === dropdown.id
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="pl-4 flex flex-col gap-0.5 pb-2">
                    {/* Direct link to hub page */}
                    {dropdown.href && (
                      <Link
                        href={dropdown.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-1 font-medium text-black-1 transition-colors duration-150 hover:bg-white-1-5"
                      >
                        {dropdown.label} Hub
                      </Link>
                    )}
                    {dropdown.sections.map((section) => (
                      <div key={section.title}>
                        {/* Section title */}
                        <div className="px-4 pt-3 pb-1 text-overline text-black-3 text-[0.6875rem]">
                          {section.title}
                        </div>
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              target={item.external ? "_blank" : undefined}
                              rel={
                                item.external ? "noopener noreferrer" : undefined
                              }
                              onClick={onClose}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-1 text-black-2 transition-colors duration-150 hover:bg-white-1-5"
                            >
                              <Icon
                                className="size-5 text-black-3 shrink-0"
                                strokeWidth={1.5}
                              />
                              {item.label}
                              {item.external && (
                                <SquareArrowOutUpRight
                                  className="size-3.5 text-black-3 ml-auto shrink-0"
                                  strokeWidth={1.5}
                                />
                              )}
                            </Link>
                          );
                        })}
                        {section.footerLink && (
                          <Link
                            href={section.footerLink.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg text-body-2 text-brand-1 transition-colors duration-150 hover:bg-white-1-5"
                          >
                            {section.footerLink.label}
                          </Link>
                        )}
                      </div>
                    ))}
                    {/* Overview link */}
                    {dropdown.overviewLink && (
                      <Link
                        href={dropdown.overviewLink.href}
                        onClick={onClose}
                        className="flex items-center justify-between mx-2 mt-2 px-4 py-4 bg-white-1-5 border border-white-2-5 rounded-lg transition-colors hover:bg-white-2"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium leading-[1.2] text-black-1 tracking-[-0.03em]">
                            {dropdown.overviewLink.label}
                          </span>
                          <span className="text-xs font-normal leading-none text-black-3 tracking-[-0.03em]">
                            {dropdown.overviewLink.description}
                          </span>
                        </div>
                        <div className="border border-black-3 rounded-full p-1.5 shrink-0">
                          <ArrowUpRight className="size-2.5 text-black-3" strokeWidth={2} />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Direct links */}
          {directLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="px-4 py-4 rounded-lg text-nav text-black-1 transition-colors duration-150 hover:bg-white-1-5"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="p-4 shrink-0 border-t border-white-2">
          <CTAButton
            label="I'm new"
            href="/im-new"
            variant="primary"
            size="full"
            theme="light"
            onClick={onClose}
          />
        </div>
      </div>
    </>
  );

  // Render via portal to avoid overflow-x-hidden clipping
  if (!mounted) return null;
  return createPortal(menu, document.body);
}
