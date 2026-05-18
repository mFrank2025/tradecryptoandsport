import { useState } from 'react';
import { Settings as SettingsIcon, Server, Globe, Bell, Shield, Palette } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [language, setLanguage] = useState('it');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const handleSave = () => {
    // In a real app, save to localStorage or backend
    localStorage.setItem('settings', JSON.stringify({
      apiUrl, language, theme, notifications, autoRefresh, refreshInterval,
    }));
    toast.success('Impostazioni salvate!');
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-emerald-600' : 'bg-gray-700'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );

  const sections = [
    {
      icon: Server,
      title: 'Connessione API',
      description: 'Configura la connessione al backend',
      content: (
        <div>
          <label className="label">URL Backend</label>
          <input className="input-field" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Il backend deve girare su questa URL</p>
        </div>
      ),
    },
    {
      icon: Globe,
      title: 'Lingua e Regione',
      description: 'Impostazioni di localizzazione',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Lingua</label>
            <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="it">Italiano</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label className="label">Fuso orario</label>
            <select className="input-field">
              <option>Europe/Rome</option>
              <option>UTC</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      icon: Palette,
      title: 'Aspetto',
      description: 'Personalizza l\'interfaccia',
      content: (
        <div>
          <label className="label">Tema</label>
          <div className="flex gap-2">
            {['dark', 'darker', 'night'].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  theme === t ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400' : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {t === 'dark' ? 'Scuro' : t === 'darker' ? 'Più scuro' : 'Notte'}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Notifiche',
      description: 'Gestisci le notifiche dell\'app',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Notifiche toast</div>
              <div className="text-xs text-gray-500">Mostra notifiche per azioni completate</div>
            </div>
            <Toggle value={notifications} onChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Auto-aggiornamento</div>
              <div className="text-xs text-gray-500">Aggiorna automaticamente i dati live</div>
            </div>
            <Toggle value={autoRefresh} onChange={setAutoRefresh} />
          </div>
          {autoRefresh && (
            <div>
              <label className="label">Intervallo aggiornamento (secondi)</label>
              <input
                type="number"
                className="input-field"
                min={5}
                max={120}
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Informazioni',
      description: 'Dettagli sull\'applicazione',
      content: (
        <div className="space-y-2 text-sm">
          {[
            { label: 'Versione', value: '1.0.0' },
            { label: 'Frontend', value: 'React 18 + TypeScript + Vite' },
            { label: 'Styling', value: 'Tailwind CSS v3' },
            { label: 'Dati', value: 'TanStack Query + Axios' },
            { label: 'Grafici', value: 'Recharts' },
            { label: 'WebSocket', value: 'Socket.io-client' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-300 font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-gray-400" />
            Impostazioni
          </h2>
          <p className="text-gray-400 text-sm mt-1">Configura l'applicazione Football Analyzer</p>
        </div>
        <Button onClick={handleSave}>Salva Impostazioni</Button>
      </div>

      {sections.map(({ icon: Icon, title, description, content }) => (
        <Card key={title}>
          <CardHeader>
            <div>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-gray-400" />
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
          </CardHeader>
          {content}
        </Card>
      ))}

      {/* Danger zone */}
      <Card className="border-red-900/50">
        <CardHeader>
          <CardTitle className="text-base text-red-400">Zona di pericolo</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Cancella cache locale</div>
              <div className="text-xs text-gray-500">Rimuove tutti i dati in cache</div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                localStorage.clear();
                toast.success('Cache cancellata');
                window.location.reload();
              }}
            >
              Cancella cache
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
