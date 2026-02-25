import React, { useState } from "react";
import { Search, X, Check } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Person, mockPeople } from "./data";
import { cn } from "@/app/components/ui/utils";

interface PersonSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (person: Person) => void;
}

export function PersonSelector({ isOpen, onClose, onSelect }: PersonSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");

    if (!isOpen) return null;

    const filteredPeople = mockPeople.filter(person => 
        person.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Select Person</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input 
                            placeholder="Search directory..." 
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredPeople.map(person => (
                        <div 
                            key={person.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
                            onClick={() => {
                                onSelect(person);
                                onClose();
                            }}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                {person.photoUrl ? (
                                    <img src={person.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                        {person.firstName[0]}{person.lastName[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900">{person.firstName} {person.lastName}</div>
                                <div className="text-xs text-gray-500">{person.email || "No email"}</div>
                            </div>
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                Select
                            </Button>
                        </div>
                    ))}
                    {filteredPeople.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No people found matching "{searchQuery}"
                        </div>
                    )}
                </div>
                
                <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
                    <span>Showing {filteredPeople.length} results</span>
                    <span className="font-medium text-blue-600 cursor-pointer hover:underline">Create new person</span>
                </div>
            </div>
        </div>
    );
}
