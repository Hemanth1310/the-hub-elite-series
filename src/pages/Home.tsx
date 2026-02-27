import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import hubLogo from '@/assets/images/hub-logo.png';

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // If user is logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show welcome page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="bg-slate-900/50 backdrop-blur border-slate-800 p-8 sm:p-12 max-w-2xl w-full text-center">
        <img src={hubLogo} alt="The Hub" className="w-24 h-24 mx-auto mb-6 object-contain" />
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Welcome to The Hub
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Predict football match results, compete with friends, and climb the leaderboard!
        </p>
        
        <Link href="/login">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
            Sign In
          </Button>
        </Link>
        
        <div className="mt-8 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            Predict match outcomes • Choose your banker • Earn points • Win glory
          </p>
        </div>
      </Card>
    </div>
  );
}
