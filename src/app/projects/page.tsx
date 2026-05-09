import { ProjectsClient } from './components/projects-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Professional project management and collaboration.',
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
