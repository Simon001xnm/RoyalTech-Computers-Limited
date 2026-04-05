
"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PlusCircle } from 'lucide-react';
import { useUser } from '@/firebase/provider';
import type { Project } from '@/types';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';
import { ProjectBoard } from './project-board';
import { ProjectForm } from './project-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ProjectsClient() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  
  // Use Dexie for local projects
  const projects = useLiveQuery(() => db.projects.toArray());
  
  const isLoading = isUserLoading || projects === undefined;

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
    await db.projects.delete(projectId);
    toast({ title: 'Project Deleted' });
  };

  const handleStatusChange = async (projectId: string, newStatus: Project['status']) => {
    await db.projects.update(projectId, { status: newStatus, updatedAt: new Date().toISOString() });
    toast({ title: 'Project Updated', description: 'Status has been changed.' });
  };

  const handleFormSubmit = async (data: any) => {
    const projectData: any = {
      ...data,
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
      updatedAt: new Date().toISOString()
    };
    
    try {
        if (editingProject) {
            await db.projects.update(editingProject.id, projectData);
            toast({ title: 'Project Updated' });
        } else {
            await db.projects.add({ 
                ...projectData, 
                id: crypto.randomUUID(), 
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
        title="Projects (Local)"
        description="Plan, track, and collaborate on projects effectively on this device."
        actionLabel="Add New Project"
        onAction={handleAddProject}
        ActionIcon={PlusCircle}
      />
      
      {isLoading ? (
        <p>Loading projects...</p>
      ) : (
        <ProjectBoard 
          projects={projects || []}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onStatusChange={handleStatusChange}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsFormOpen(false); setEditingProject(null); } else { setIsFormOpen(true); }}}>
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
