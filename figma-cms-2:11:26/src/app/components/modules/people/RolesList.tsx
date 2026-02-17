import React, { useState } from "react";
import { Plus, Trash2, Shield, Edit2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Role, mockRoles } from "./data";
import { cn } from "@/app/components/ui/utils";

export function RolesList() {
    const [roles, setRoles] = useState<Role[]>(mockRoles);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    
    // Editor State
    const [formData, setFormData] = useState<Partial<Role>>({
        name: "",
        color: "bg-gray-100 text-gray-700",
        description: ""
    });

    const openEditor = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData(role);
        } else {
            setEditingRole(null);
            setFormData({
                name: "",
                color: "bg-gray-100 text-gray-700",
                description: ""
            });
        }
        setIsEditorOpen(true);
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (editingRole) {
            setRoles(roles.map(r => r.id === editingRole.id ? { ...editingRole, ...formData } as Role : r));
        } else {
            const newRole: Role = {
                id: `r-${Date.now()}`,
                name: formData.name,
                color: formData.color || "bg-gray-100 text-gray-700",
                description: formData.description
            };
            setRoles([...roles, newRole]);
        }
        setIsEditorOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure?")) {
            setRoles(roles.filter(r => r.id !== id));
        }
    };

    const colors = [
        "bg-gray-100 text-gray-700",
        "bg-red-100 text-red-700",
        "bg-orange-100 text-orange-700",
        "bg-amber-100 text-amber-700",
        "bg-green-100 text-green-700",
        "bg-blue-100 text-blue-700",
        "bg-purple-100 text-purple-700",
        "bg-pink-100 text-pink-700",
    ];

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Roles</h1>
                    <p className="text-gray-500 mt-1">Define permissions and badges for people in your organization.</p>
                </div>
                <Button className="bg-black text-white" onClick={() => openEditor()}>
                    <Plus className="w-4 h-4 mr-2" /> Create Role
                </Button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {roles.map(role => (
                    <div key={role.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => openEditor(role)}>
                                <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("px-3 py-1 rounded text-sm font-bold uppercase tracking-wide", role.color)}>
                                {role.name}
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm">{role.description || "No description provided."}</p>
                        <div className="mt-4 pt-4 border-t text-xs text-gray-400 font-mono">ID: {role.id}</div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isEditorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-bold">{editingRole ? "Edit Role" : "New Role"}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label>Role Name</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Worship Leader"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Input 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Brief explanation of this role"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Badge Color</Label>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFormData({...formData, color: c})}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                                c.split(" ")[0], // Extract bg class
                                                formData.color === c ? "border-gray-900 scale-110" : "border-transparent"
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className={cn("mt-2 px-3 py-1 rounded text-sm font-bold uppercase tracking-wide inline-block", formData.color)}>
                                    Preview
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save Role</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
