import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { 
    X, 
    User, 
    Upload, 
    Mail, 
    Phone, 
    Shield, 
    Users,
    Check
} from "lucide-react";
import { 
    Person, 
    mockRoles, 
    mockGroups, 
    Role, 
    Group 
} from "./data";
import { cn } from "@/app/components/ui/utils";

interface PersonEditorProps {
    person: Person | null; // null = new person
    isOpen: boolean;
    onClose: () => void;
    onSave: (person: Person) => void;
}

export function PersonEditor({ person, isOpen, onClose, onSave }: PersonEditorProps) {
    const [formData, setFormData] = useState<Partial<Person>>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        status: "active",
        roleIds: [],
        groupIds: []
    });

    useEffect(() => {
        if (person) {
            setFormData({ ...person });
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                status: "active",
                roleIds: [],
                groupIds: []
            });
        }
    }, [person, isOpen]);

    if (!isOpen) return null;

    const toggleItem = (list: string[], item: string) => {
        if (list.includes(item)) {
            return list.filter(i => i !== item);
        }
        return [...list, item];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.firstName || !formData.lastName) return;

        const now = new Date().toISOString();
        const savedPerson: Person = {
            id: person?.id || `p${Date.now()}`,
            firstName: formData.firstName || "",
            lastName: formData.lastName || "",
            email: formData.email,
            phone: formData.phone,
            photoUrl: formData.photoUrl,
            status: formData.status as any,
            roleIds: formData.roleIds || [],
            groupIds: formData.groupIds || [],
            createdAt: person?.createdAt || now,
            updatedAt: now
        };

        onSave(savedPerson);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {person ? "Edit Person" : "Add New Person"}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {person ? "Update profile details and permissions." : "Create a new record in the system."}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-gray-400" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative group cursor-pointer">
                            {formData.photoUrl ? (
                                <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <User className="w-10 h-10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide cursor-pointer hover:underline">Upload Photo</p>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b pb-2 mb-4">Core Information</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-gray-700">First Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.firstName} 
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    placeholder="Jane"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-gray-700">Last Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.lastName} 
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Email Address</Label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <Input 
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="pl-9" 
                                    placeholder="jane.doe@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Phone Number</Label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <Input 
                                    value={formData.phone} 
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="pl-9" 
                                    placeholder="(555) 000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Status</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Roles & Groups */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Roles & Groups</h3>
                        
                        {/* Roles */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                                <Shield className="w-3 h-3 text-blue-600" /> System Roles
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {mockRoles.map(role => {
                                    const isSelected = formData.roleIds?.includes(role.id);
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => setFormData({
                                                ...formData, 
                                                roleIds: toggleItem(formData.roleIds || [], role.id)
                                            })}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                                                isSelected 
                                                    ? "bg-gray-900 text-white border-gray-900" 
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            {isSelected && <Check className="w-3 h-3" />}
                                            {role.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Groups */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                                <Users className="w-3 h-3 text-green-600" /> Groups
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {mockGroups.map(group => {
                                    const isSelected = formData.groupIds?.includes(group.id);
                                    return (
                                        <div 
                                            key={group.id}
                                            onClick={() => setFormData({
                                                ...formData, 
                                                groupIds: toggleItem(formData.groupIds || [], group.id)
                                            })}
                                            className={cn(
                                                "p-3 rounded-lg border text-left cursor-pointer transition-all hover:shadow-sm relative",
                                                isSelected 
                                                    ? "border-green-500 bg-green-50/30" 
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            )}
                                        >
                                            <div className="text-xs font-bold text-gray-900 mb-0.5">{group.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{group.category}</div>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 text-green-600">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1 bg-black text-white hover:bg-gray-800" onClick={handleSubmit}>
                        {person ? "Save Changes" : "Create Person"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
