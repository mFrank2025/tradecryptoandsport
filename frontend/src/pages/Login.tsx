import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@mepaflow.it');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Demo login: any password works with these demo accounts
    const demoUsers: Record<string, { id: string; name: string; role: 'admin' | 'operatore' }> = {
      'admin@mepaflow.it': { id: '1', name: 'Marco Rossi', role: 'admin' },
      'operatore@mepaflow.it': { id: '2', name: 'Anna Bianchi', role: 'operatore' },
    };

    await new Promise((r) => setTimeout(r, 600));

    const user = demoUsers[email.toLowerCase()];
    if (user && password.length >= 6) {
      login('demo_jwt_token_' + Date.now(), { ...user, email });
      navigate('/');
    } else {
      setError('Credenziali non valide. Usa admin@mepaflow.it o operatore@mepaflow.it con password di almeno 6 caratteri.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-4">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MepaFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestione catalogo MePA professionale</p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground mb-6">Accedi al tuo account</h2>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@esempio.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <div className="mt-5 rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Account demo:</p>
            <p>Admin: admin@mepaflow.it</p>
            <p>Operatore: operatore@mepaflow.it</p>
            <p className="text-muted-foreground">Password: qualsiasi (min. 6 caratteri)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
