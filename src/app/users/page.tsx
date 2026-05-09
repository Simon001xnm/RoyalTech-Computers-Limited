import type { Metadata } from 'next';
import { UsersClient } from './components/users-client';

export const metadata: Metadata = {
  title: 'Users',
  description: 'User management and access control.',
};

export default function UsersPage() {
  return <UsersClient />;
}
