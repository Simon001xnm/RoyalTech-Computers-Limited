
import { ProjectsClient } from './components/projects-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Project management for RoyalTech.',
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}

