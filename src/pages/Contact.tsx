import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import hubLogo from '@/assets/images/hub-logo.png';

export default function Contact() {
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
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-semibold mb-4 text-white">Contact</h1>
            <p className="text-slate-300 mb-6">
              Have questions, feedback, or need access? Reach out and we’ll help.
            </p>

            <div className="space-y-4 text-slate-300">
              <div>
                <div className="text-slate-400 text-sm">Email</div>
                <div className="text-white">matchtips.official@gmail.com</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Support hours</div>
                <div className="text-white">Mon–Fri, 9:00–18:00</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
