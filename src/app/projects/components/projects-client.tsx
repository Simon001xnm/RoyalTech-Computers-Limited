
"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PlusCircle } from 'lucide-react';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Project } from '@/types';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ProjectBoard } from './project-board';
import { ProjectForm } from './project-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ProjectsClient() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  
  const projectsCollection = useMemoFirebase(() => user ? collection(firestore, 'projects') : null, [firestore, user]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsCollection);
  
  const isLoading = isUserLoading || projectsLoading;

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

  const handleDeleteProject = (projectId: string) => {
    const docRef = doc(firestore, 'projects', projectId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'Project Deleted' });
  };

  const handleStatusChange = (projectId: string, newStatus: Project['status']) => {
    const docRef = doc(firestore, 'projects', projectId);
    setDocumentNonBlocking(docRef, { status: newStatus }, { merge: true });
    toast({ title: 'Project Updated', description: 'Status has been changed.' });
  };

  const handleFormSubmit = (data: any) => {
    const projectData: { [key: string]: any } = {
      ...data,
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
    };
    
    // Explicitly remove the dueDate key if it is undefined
    if (projectData.dueDate === undefined) {
        delete projectData.dueDate;
    }
    
    if (editingProject) {
      const docRef = doc(firestore, 'projects', editingProject.id);
      setDocumentNonBlocking(docRef, projectData, { merge: true });
      toast({ title: 'Project Updated' });
    } else {
      if (!projectsCollection) {
        toast({ variant: 'destructive', title: 'Error', description: 'User must be authenticated to create a project.' });
        return;
      }
      addDocumentNonBlocking(projectsCollection, projectData);
      toast({ title: 'Project Created' });
    }
    
    setIsFormOpen(false);
    setEditingProject(null);
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Plan, track, and collaborate on projects effectively."
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
