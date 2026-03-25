import { useAuth } from '@/lib/AuthContext';
import ArchitectView from '../components/closure/ArchitectView';

export default function ArchitectPage() {
  const { currentUser } = useAuth();
  if (currentUser?.role !== 'admin') {
    return <div className="text-center py-20 text-gray-400">גישה מוגבלת למנהלי עירייה בלבד</div>;
  }
  return <ArchitectView />;
}