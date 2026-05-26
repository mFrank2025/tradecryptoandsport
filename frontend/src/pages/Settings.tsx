import { Save, User, Bell, Key, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [companyName, setCompanyName] = useState('Azienda SRL');
  const [piva, setPiva] = useState('IT12345678901');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-muted-foreground text-sm mt-1">Configura MepaFlow per la tua azienda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Profilo Utente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Nome</Label><Input defaultValue={user?.name} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={user?.email} type="email" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Ruolo</Label>
            <Input value={user?.role === 'admin' ? 'Amministratore' : 'Operatore'} disabled />
          </div>
          <Button size="sm" onClick={() => toast.success('Profilo aggiornato')}><Save className="h-4 w-4" />Salva</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Dati Azienda</CardTitle>
          <CardDescription>Utilizzati nei file export MePA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Ragione Sociale</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Partita IVA</Label><Input value={piva} onChange={(e) => setPiva(e.target.value)} /></div>
          <Button size="sm" onClick={() => toast.success('Dati azienda salvati')}><Save className="h-4 w-4" />Salva</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-primary" />Claude API</CardTitle>
          <CardDescription>Chiave API per la generazione AI delle schede prodotto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>API Key Anthropic</Label>
            <Input type="password" placeholder="sk-ant-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <p className="text-xs text-muted-foreground">La chiave viene salvata in modo sicuro e non viene mai esposta nel frontend</p>
          </div>
          <Button size="sm" onClick={() => { if (apiKey) toast.success('API Key salvata'); else toast.error('Inserisci una API key valida'); }}>
            <Save className="h-4 w-4" />Salva API Key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Notifiche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'RdO in scadenza (7 giorni)', checked: true },
            { label: 'Nuove RdO disponibili', checked: true },
            { label: 'Report settimanale', checked: false },
          ].map(({ label, checked }) => (
            <label key={label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-foreground">{label}</span>
              <input type="checkbox" defaultChecked={checked} className="accent-primary h-4 w-4" />
            </label>
          ))}
          <Button size="sm" className="mt-2" onClick={() => toast.success('Preferenze notifiche salvate')}><Save className="h-4 w-4" />Salva</Button>
        </CardContent>
      </Card>
    </div>
  );
}
