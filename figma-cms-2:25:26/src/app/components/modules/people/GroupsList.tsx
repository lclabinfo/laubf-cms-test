import React, { useState } from "react";
import { Plus, Trash2, Users, Edit2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Group, mockGroups } from "./data";
import { cn } from "@/app/components/ui/utils";

export function GroupsList() {
    const [groups, setGroups] = useState<Group[]>(mockGroups);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    
    // Editor State
    const [formData, setFormData] = useState<Partial<Group>>({
        name: "",
        category: "Community",
        description: ""
    });

    const openEditor = (group?: Group) => {
        if (group) {
            setEditingGroup(group);
            setFormData(group);
        } else {
            setEditingGroup(null);
            setFormData({
                name: "",
                category: "Community",
                description: ""
            });
        }
        setIsEditorOpen(true);
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (editingGroup) {
            setGroups(groups.map(g => g.id === editingGroup.id ? { ...editingGroup, ...formData } as Group : g));
        } else {
            const newGroup: Group = {
                id: `g-${Date.now()}`,
                name: formData.name,
                category: formData.category || "Community",
                description: formData.description
            };
            setGroups([...groups, newGroup]);
        }
        setIsEditorOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure?")) {
            setGroups(groups.filter(g => g.id !== id));
        }
    };

    const categories = ["Community", "Serving", "Ministry", "Classes", "Events"];

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Groups</h1>
                    <p className="text-gray-500 mt-1">Organize people into teams, small groups, and serving units.</p>
                </div>
                <Button className="bg-black text-white" onClick={() => openEditor()}>
                    <Plus className="w-4 h-4 mr-2" /> Create Group
                </Button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {groups.map(group => (
                    <div key={group.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => openEditor(group)}>
                                <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-xs font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {group.category}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{group.name}</h3>
                        <p className="text-gray-500 text-sm">{group.description || "No description provided."}</p>
                        
                        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            <span>0 members</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isEditorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-bold">{editingGroup ? "Edit Group" : "New Group"}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label>Group Name</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Welcome Team"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Category</Label>
                                <select 
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Input 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Brief explanation of this group"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save Group</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
