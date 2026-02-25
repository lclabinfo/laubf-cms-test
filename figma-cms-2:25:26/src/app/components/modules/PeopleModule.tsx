import React from "react";
import { PeopleList } from "./people/PeopleList";
import { RolesList } from "./people/RolesList";
import { GroupsList } from "./people/GroupsList";

interface PeopleModuleProps {
    activePage?: string;
}

export function PeopleModule({ activePage = "directory" }: PeopleModuleProps) {
    // Render the appropriate sub-module based on the active page
    switch (activePage) {
        case "roles":
            return (
                <div className="h-full rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <RolesList />
                </div>
            );
        case "groups":
            return (
                <div className="h-full rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <GroupsList />
                </div>
            );
        case "directory":
        default:
            return (
                <div className="h-full rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <PeopleList />
                </div>
            );
    }
}
