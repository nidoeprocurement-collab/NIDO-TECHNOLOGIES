import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-2">
          You don't have permission to view this page.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Contact your administrator to request access, or return to a page you have access to.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <Home size={16} />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
