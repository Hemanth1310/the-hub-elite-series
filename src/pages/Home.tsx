import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 sm:px-10">
          <div className="w-full max-w-3xl text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-lg tracking-widest font-semibold">
              <span className="text-white">MATCH</span>
              <span className="text-emerald-400">TIPS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-semibold">The weekly football match</h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Predict the matches. Compete with friends.<br />
              Win the round.
            </p>

            <Link href="/login">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10">
                Log in
              </Button>
            </Link>

            <div className="pt-6 space-y-6">
              <div className="mx-auto h-px w-3/4 bg-slate-800" />
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
                MatchTips is a football competition where you predict the matches and compete against
                friends, family, colleagues — and the rest of Norway — to prove who knows football best.
              </p>
              <p className="text-slate-500 text-sm">
                Bet on the Eliteserien, World Cup, Premier League and Champions League.
              </p>
              <div className="mx-auto h-px w-3/4 bg-slate-800" />
              <p className="text-slate-400 text-sm">Only invited participants have access.</p>
              <p className="text-slate-500 text-xs">Do you want an invitation? matchtips.official@gmail.com</p>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-900/80 px-6 sm:px-10 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>MatchTips © 2026 • A product from The HUB</div>
          <div className="flex items-center gap-3">
            <span>Contact</span>
            <span>•</span>
            <span>Privacy</span>
            <span>•</span>
            <span>Terms</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
