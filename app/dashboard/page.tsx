import Dashboard from '@/components/Dashboard';
import RoleGate from '@/src/components/RoleGate';

export const metadata = {
  title: 'Tablero maestro — Ruum Ruum',
};

export default function DashboardPage() {
  return (
    <RoleGate allowed={['admin', 'conductor']}>
      <Dashboard />
    </RoleGate>
  );
}
