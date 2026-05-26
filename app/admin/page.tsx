import AdminDashboard from '@/components/AdminDashboard';
import RoleGate from '@/src/components/RoleGate';

export default function AdminPage() {
  return (
    <RoleGate allowed={['admin']}>
      <AdminDashboard />
    </RoleGate>
  );
}
