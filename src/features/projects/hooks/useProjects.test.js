import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useProjects } from './useProjects';
import { useAuth } from '../../auth/AuthContext';
import * as firestore from 'firebase/firestore';

// Mock dependencies
vi.mock('../../auth/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../../services/firebase/config', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        onSnapshot: vi.fn(),
        addDoc: vi.fn(),
        deleteDoc: vi.fn(),
        doc: vi.fn(),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
        updateDoc: vi.fn()
    };
});

describe('useProjects hook', () => {
    let mockUser;

    beforeEach(() => {
        mockUser = {
            uid: 'test-uid',
            email: 'test@example.com',
            displayName: 'Test User'
        };
        useAuth.mockReturnValue({ user: mockUser });
        vi.clearAllMocks();
    });

    it('should return empty projects and not loading if user is not authenticated', () => {
        useAuth.mockReturnValue({ user: null });
        const { result } = renderHook(() => useProjects());

        expect(result.current.projects).toEqual([]);
        expect(result.current.loading).toBe(false);
    });

    it('should setup onSnapshot listeners when user is authenticated', () => {
        let uidCallback, emailCallback;
        const unsubUid = vi.fn();
        const unsubEmail = vi.fn();

        firestore.onSnapshot.mockImplementation((query, onNext) => {
            if (query === 'qUid') {
                uidCallback = onNext;
                return unsubUid;
            } else {
                emailCallback = onNext;
                return unsubEmail;
            }
        });

        firestore.where.mockImplementation((field, op, value) => {
            return `where-${field}-${value}`;
        });

        firestore.query.mockImplementation((ref, condition) => {
            if (condition.includes('test-uid')) return 'qUid';
            return 'qEmail';
        });

        renderHook(() => useProjects());

        expect(firestore.onSnapshot).toHaveBeenCalledTimes(2);
    });

    it('should create a new project successfully', async () => {
        firestore.addDoc.mockResolvedValueOnce({ id: 'new-project-id' }).mockResolvedValueOnce({ id: 'member-doc-id' });

        const { result } = renderHook(() => useProjects());

        let res;
        await act(async () => {
            res = await result.current.createProject({
                name: 'Test Project',
                description: 'Test Description',
                emoji: '🚀'
            });
        });

        expect(res.success).toBe(true);
        expect(res.id).toBe('new-project-id');
        expect(firestore.addDoc).toHaveBeenCalledTimes(2); // One for project, one for member
    });

    it('should handle project creation error', async () => {
        firestore.addDoc.mockRejectedValueOnce(new Error('Firebase error'));

        const { result } = renderHook(() => useProjects());

        let res;
        await act(async () => {
            res = await result.current.createProject({
                name: 'Test Project'
            });
        });

        expect(res.success).toBe(false);
        expect(res.error).toBe('Firebase error');
    });

    it('should deduplicate projects from email and uid queries', () => {
        // Setup mock logic for merging documents
        const mockUidSnap = {
            docs: [
                { id: '1', data: () => ({ name: 'Project 1', createdAt: { toDate: () => 1000 } }) },
                { id: '2', data: () => ({ name: 'Project 2', createdAt: { toDate: () => 2000 } }) }
            ]
        };

        const mockEmailSnap = {
            docs: [
                { id: '2', data: () => ({ name: 'Project 2', createdAt: { toDate: () => 2000 } }) }, // Duplicate
                { id: '3', data: () => ({ name: 'Project 3', createdAt: { toDate: () => 3000 } }) }
            ]
        };

        firestore.onSnapshot.mockImplementation((query, onNext) => {
            if (query === 'qUid') onNext(mockUidSnap);
            if (query === 'qEmail') onNext(mockEmailSnap);
            return vi.fn();
        });

        firestore.where.mockImplementation((field, op, value) => {
            return `where-${field}-${value}`;
        });

        firestore.query.mockImplementation((ref, condition) => {
            if (condition.includes('test-uid')) return 'qUid';
            return 'qEmail';
        });

        const { result } = renderHook(() => useProjects());

        // Wait for state updates
        expect(result.current.loading).toBe(false);
        expect(result.current.projects.length).toBe(3);

        // Ensure sorted by createdAt DESC (3000, 2000, 1000 => id: 3, 2, 1)
        expect(result.current.projects[0].id).toBe('3');
        expect(result.current.projects[1].id).toBe('2');
        expect(result.current.projects[2].id).toBe('1');
    });
});
