import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import hubLogo from '@/assets/images/hub-logo.png';
import { AlertCircle, Info } from 'lucide-react';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabaseConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      setLocation('/dashboard');
    }
  };

  // Real login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="bg-slate-900/50 backdrop-blur border-slate-800 p-8 sm:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <img src={hubLogo} alt="The Hub" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to The Hub</h1>
          <p className="text-slate-400 text-sm">Sign in to make your predictions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!supabaseConfigured && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
              <Info className="w-4 h-4" />
              <AlertDescription>
                Supabase is not configured. Check your <code>/docs/SUPABASE-SETUP.md</code> and environment variables.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !supabaseConfigured}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            Need access? Contact your admin to get login credentials.
          </p>
        </div>
      </Card>
    </div>
  );
}
