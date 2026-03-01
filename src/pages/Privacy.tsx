import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import hubLogo from '@/assets/images/hub-logo.png';

export default function Privacy() {
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
            <h1 className="text-3xl sm:text-4xl font-semibold">Privacy Policy</h1>
            <p className="text-slate-300">
              We collect only what we need to run MatchTips: your account details, predictions, and
              results. We never sell your data.
            </p>

            <div className="space-y-4 text-slate-300">
              <div>
                <div className="text-slate-400 text-sm">What we collect</div>
                <p>Account info (name, email), predictions, and competition stats.</p>
              </div>
              <div>
                <div className="text-slate-400 text-sm">How we use it</div>
                <p>To run competitions, display leaderboards, and send email notifications.</p>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Your rights</div>
                <p>Request access or deletion by emailing matchtips.official@gmail.com.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
