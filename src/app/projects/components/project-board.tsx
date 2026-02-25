
"use client";

import type { Project } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ProjectBoardProps {
  projects: Project[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onStatusChange: (projectId: string, newStatus: Project['status']) => void;
}

const ProjectCard = ({ project, onEditProject, onDeleteProject }: { project: Project; onEditProject: (project: Project) => void; onDeleteProject: (projectId: string) => void; }) => {
  return (
    <Card className="mb-4 bg-card/80 hover:bg-card transition-colors shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold">{project.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditProject(project)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {project.description && <CardDescription className="text-xs">{project.description}</CardDescription>}
      </CardHeader>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
        {project.dueDate ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(project.dueDate), 'MMM d')}</span>
          </div>
        ) : <div />}
      </CardFooter>
    </Card>
  );
};


export function ProjectBoard({ projects, onEditProject, onDeleteProject, onStatusChange }: ProjectBoardProps) {
  const columns: { title: Project['status']; projects: Project[] }[] = [
    { title: "Todo", projects: projects.filter(p => p.status === 'Todo') },
    { title: "In Progress", projects: projects.filter(p => p.status === 'In Progress') },
    { title: "Done", projects: projects.filter(p => p.status === 'Done') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(column => (
        <div key={column.title} className="bg-muted/50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-center">{column.title} <Badge variant="secondary">{column.projects.length}</Badge></h2>
          <div className="min-h-[200px]">
            {column.projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onEditProject={onEditProject} 
                onDeleteProject={onDeleteProject} 
              />
            ))}
            {column.projects.length === 0 && (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                <p>No projects in this column.</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
