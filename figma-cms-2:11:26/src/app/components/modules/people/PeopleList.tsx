import React, { useState } from "react";
import { 
    Search, 
    Plus, 
    Filter, 
    MoreHorizontal, 
    Mail, 
    Phone, 
    Shield,
    Users,
    Trash2
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { 
    Person, 
    mockPeople, 
    mockRoles, 
    mockGroups 
} from "./data";
import { PersonEditor } from "./PersonEditor";
import { cn } from "@/app/components/ui/utils";

export function PeopleList() {
    const [people, setPeople] = useState<Person[]>(mockPeople);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    
    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    // Derived State
    const filteredPeople = people.filter(person => {
        const matchesSearch = 
            person.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            person.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            person.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || person.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Handlers
    const handleSavePerson = (person: Person) => {
        if (editingPerson) {
            // Update existing
            setPeople(people.map(p => p.id === person.id ? person : p));
        } else {
            // Create new
            setPeople([person, ...people]);
        }
    };

    const handleDeletePerson = (id: string) => {
        if (confirm("Are you sure you want to delete this person? This cannot be undone.")) {
            setPeople(people.filter(p => p.id !== id));
        }
    };

    const getRoleName = (id: string) => mockRoles.find(r => r.id === id)?.name;
    const getRoleColor = (id: string) => mockRoles.find(r => r.id === id)?.color || "bg-gray-100 text-gray-700";

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">People</h1>
                    <p className="text-gray-500 mt-1">Manage members, leaders, and staff across your organization.</p>
                </div>
                <Button 
                    className="bg-black text-white hover:bg-gray-800 gap-2"
                    onClick={() => {
                        setEditingPerson(null);
                        setIsEditorOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4" /> Add Person
                </Button>
            </div>

            {/* Toolbar */}
            <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input 
                        placeholder="Search by name or email..." 
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select 
                            className="h-10 pl-3 pr-8 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                        </select>
                        <Filter className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-8 py-3 font-semibold text-gray-900 w-[300px]">Name</th>
                            <th className="px-8 py-3 font-semibold text-gray-900 w-[200px]">Contact</th>
                            <th className="px-8 py-3 font-semibold text-gray-900">Roles</th>
                            <th className="px-8 py-3 font-semibold text-gray-900">Groups</th>
                            <th className="px-8 py-3 font-semibold text-gray-900 w-[100px]">Status</th>
                            <th className="px-8 py-3 font-semibold text-gray-900 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPeople.map((person) => (
                            <tr 
                                key={person.id} 
                                className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setEditingPerson(person);
                                    setIsEditorOpen(true);
                                }}
                            >
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                            {person.photoUrl ? (
                                                <img src={person.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                                    {person.firstName[0]}{person.lastName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{person.firstName} {person.lastName}</div>
                                            <div className="text-xs text-gray-500">ID: {person.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="space-y-1">
                                        {person.email && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                {person.email}
                                            </div>
                                        )}
                                        {person.phone && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                {person.phone}
                                            </div>
                                        )}
                                        {!person.email && !person.phone && (
                                            <span className="text-gray-400 italic text-xs">No contact info</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {person.roleIds.length > 0 ? person.roleIds.map(roleId => (
                                            <span 
                                                key={roleId}
                                                className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-transparent",
                                                    getRoleColor(roleId)
                                                )}
                                            >
                                                {getRoleName(roleId)}
                                            </span>
                                        )) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {person.groupIds.length > 0 ? (
                                            <>
                                                {person.groupIds.slice(0, 2).map(groupId => (
                                                    <span key={groupId} className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                        {mockGroups.find(g => g.id === groupId)?.name}
                                                    </span>
                                                ))}
                                                {person.groupIds.length > 2 && (
                                                    <span className="text-xs text-gray-500 pl-1">+{person.groupIds.length - 2} more</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                        person.status === 'active' ? "bg-green-50 text-green-700 border-green-200" :
                                        person.status === 'inactive' ? "bg-gray-50 text-gray-600 border-gray-200" :
                                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            person.status === 'active' ? "bg-green-500" :
                                            person.status === 'inactive' ? "bg-gray-400" :
                                            "bg-yellow-500"
                                        )} />
                                        {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePerson(person.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {filteredPeople.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No people found</h3>
                        <p className="text-sm max-w-sm text-center mt-1">Try adjusting your search or filters, or add a new person to the directory.</p>
                        <Button 
                            variant="outline" 
                            className="mt-6"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>

            <PersonEditor 
                person={editingPerson}
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSavePerson}
            />
        </div>
    );
}
