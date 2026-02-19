import { Link, useLocation } from 'wouter';
import { Home, Trophy, List, BarChart3, Settings, Target, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import hubLogo from '@/assets/images/hub-logo.png';

export default function LayoutV1({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');

  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      setCompetitions(data || []);
      if (data && data.length > 0 && !selectedCompetition) {
        setSelectedCompetition(data[0].id);
      }
    };
    fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo & Title */}
            <Link href="/">
              <a className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <img src={hubLogo} alt="The Hub" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-white">
                    The Hub <span className="text-blue-400 text-xs sm:text-sm">v1</span>
                  </h1>
                </div>
              </a>
            </Link>

            {/* Competition Selector - Hidden on small mobile */}
            <div className="hidden sm:block flex-1 max-w-50 md:max-w-60">
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((comp: any) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-400 hidden md:inline">{user?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="container mx-auto px-2 sm:px-4 py-0">
          <div className="flex gap-0.5 sm:gap-1 justify-around sm:justify-start overflow-x-auto">
            <NavLink href="/version1" icon={Home} label="Home" active={location === '/version1'} />
            <NavLink href="/version1/active" icon={Target} label="Active Now" active={location === '/version1/active'} />
            <NavLink href="/version1/leaderboard" icon={Trophy} label="Leaderboard" active={location === '/version1/leaderboard'} />
            <NavLink href="/version1/rounds" icon={List} label="Rounds" active={location === '/version1/rounds'} />
            <NavLink href="/version1/stats" icon={BarChart3} label="Stats" active={location === '/version1/stats'} />
            
            {user?.isAdmin && (
              <NavLink href="/version1/admin" icon={Settings} label="Admin" active={location === '/version1/admin'} />
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link href={href}>
      <a
        className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-t-lg transition-colors whitespace-nowrap shrink-0 ${
          active
            ? 'bg-slate-800 text-white border-b-2 border-blue-500'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-[10px] sm:text-sm font-medium">{label}</span>
      </a>
    </Link>
  );
}
