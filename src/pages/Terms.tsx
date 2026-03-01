import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import hubLogo from '@/assets/images/hub-logo.png';

export default function Terms() {
  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 sm:px-10 py-6">
          <Link href="/">
            <a className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src={hubLogo} alt="The Hub" className="w-8 h-8 object-contain" />
              <span className="text-sm text-slate-300">MatchTips</span>
            </a>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Log in
            </Button>
          </Link>
        </header>

        <main className="flex-1 px-6 sm:px-10 py-10">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">Terms of Service</h1>
            <p className="text-slate-300">
              MatchTips is an invite-only competition. By using the platform, you agree to play fair,
              respect other players, and follow competition rules set by the admin.
            </p>

            <div className="space-y-4 text-slate-300">
              <div>
                <div className="text-slate-400 text-sm">Eligibility</div>
                <p>Access is by invitation. Admins may revoke access for abuse or misconduct.</p>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Usage</div>
                <p>Predictions must be submitted before the deadline to count.</p>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Liability</div>
                <p>MatchTips is provided “as is” with no guarantees of availability or outcomes.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
