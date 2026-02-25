
export type PersonStatus = 'active' | 'inactive' | 'archived';

export interface Role {
    id: string;
    name: string;
    color: string;
    description?: string;
}

export interface Group {
    id: string;
    name: string;
    category: string;
    description?: string;
}

export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
    status: PersonStatus;
    roleIds: string[];
    groupIds: string[];
    createdAt: string;
    updatedAt: string;
}

// Mock Data Stores
export const mockRoles: Role[] = [
    { id: 'r1', name: 'Member', color: 'bg-blue-100 text-blue-700' },
    { id: 'r2', name: 'Leader', color: 'bg-purple-100 text-purple-700' },
    { id: 'r3', name: 'Staff', color: 'bg-amber-100 text-amber-700' },
    { id: 'r4', name: 'Admin', color: 'bg-red-100 text-red-700' },
];

export const mockGroups: Group[] = [
    { id: 'g1', name: 'Worship Team', category: 'Serving' },
    { id: 'g2', name: 'Welcome Team', category: 'Serving' },
    { id: 'g3', name: 'College Group', category: 'Community' },
    { id: 'g4', name: 'Young Adults', category: 'Community' },
    { id: 'g5', name: 'Prayer Warriors', category: 'Ministry' },
];

export const mockPeople: Person[] = [
    {
        id: 'p1',
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'jordan.lee@example.com',
        phone: '555-0123',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80',
        status: 'active',
        roleIds: ['r2', 'r3'], // Leader, Staff
        groupIds: ['g1', 'g3'], // Worship, College
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
    },
    {
        id: 'p2',
        firstName: 'Emily',
        lastName: 'Zhang',
        email: 'emily.z@example.com',
        phone: '555-0124',
        photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
        status: 'active',
        roleIds: ['r2'], // Leader
        groupIds: ['g3'], // College
        createdAt: '2023-02-10T09:00:00Z',
        updatedAt: '2024-01-18T11:20:00Z'
    },
    {
        id: 'p3',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.b@example.com',
        phone: '555-0125',
        status: 'active',
        roleIds: ['r1'], // Member
        groupIds: ['g1'], // Worship
        createdAt: '2023-03-05T14:00:00Z',
        updatedAt: '2023-03-05T14:00:00Z'
    },
    {
        id: 'p4',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@example.com',
        status: 'inactive',
        roleIds: ['r1'], // Member
        groupIds: [],
        createdAt: '2023-04-20T16:45:00Z',
        updatedAt: '2023-12-01T09:00:00Z'
    },
    {
        id: 'p5',
        firstName: 'David',
        lastName: 'Kim',
        email: 'd.kim@example.com',
        status: 'active',
        roleIds: ['r2'], // Leader
        groupIds: ['g1', 'g5'], // Worship, Prayer
        createdAt: '2023-05-12T08:30:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
    }
];
