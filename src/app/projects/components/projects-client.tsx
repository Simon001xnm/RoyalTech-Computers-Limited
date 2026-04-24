"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Project } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ProjectBoard } from './project-board';
import { ProjectForm } from './project-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSaaS } from '@/components/saas/saas-provider';
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export function ProjectsClient() {
  const { toast } = useToast();
  const { user } = useUser();
  const { tenant } = useSaaS();
  const firestore = useFirestore();
  
  // FIRESTORE Isolated Query
  const projectsQuery = useMemoFirebase(() => {
    if (!tenant) return null;
    return query(collection(firestore, 'projects'), where('tenantId', '==', tenant.id));
  }, [firestore, tenant?.id]);
  const { data: projects, isLoading } = useCollection(projectsQuery);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleAddProject = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
        await deleteDoc(doc(firestore, 'projects', projectId));
        toast({ title: 'Project Deleted' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: Project['status']) => {
    try {
        await updateDoc(doc(firestore, 'projects', projectId), { status: newStatus, updatedAt: new Date().toISOString() });
        toast({ title: 'Project Updated', description: 'Status has been changed.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!tenant) return;

    const projectData: any = {
      ...data,
      tenantId: tenant.id,
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
      updatedAt: new Date().toISOString()
    };
    
    try {
        if (editingProject) {
            await updateDoc(doc(firestore, 'projects', editingProject.id), projectData);
            toast({ title: 'Project Updated' });
        } else {
            await addDoc(collection(firestore, 'projects'), { 
                ...projectData, 
                createdAt: new Date().toISOString(),
                createdBy: { uid: user?.uid || 'local', name: user?.displayName || 'User' }
            });
            toast({ title: 'Project Created' });
        }
        setIsFormOpen(false);
        setEditingProject(null);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  return (
    <>
      <PageHeader
        title="Project Management (Cloud)"
        description="Plan, track, and collaborate on projects effectively across your team."
        actionLabel="Add New Project"
        onAction={handleAddProject}
        ActionIcon={PlusCircle}
      />
      
      {isLoading ? (
        <p className="animate-pulse">Syncing project board...</p>
      ) : (
        <ProjectBoard 
          projects={projects || []}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onStatusChange={handleStatusChange}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingProject(null); }}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
            <DialogDescription>
              {editingProject ? 'Update the details of your project.' : 'Fill in the details to create a new project.'}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingProject(null); }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
