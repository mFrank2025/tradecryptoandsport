import { Package, ClipboardList, TrendingUp, Award, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { mockKpi, mockRdO, monthlyData } from '../lib/mockData';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { Link } from 'react-router-dom';

const rdoStatoVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  nuova: 'info',
  in_lavorazione: 'warning',
  offerta_inviata: 'default',
  aggiudicata: 'success',
  persa: 'destructive',
  scaduta: 'secondary',
};

const rdoStatoLabels: Record<string, string> = {
  nuova: 'Nuova', in_lavorazione: 'In lavorazione', offerta_inviata: 'Offerta inviata',
  aggiudicata: 'Aggiudicata', persa: 'Persa', scaduta: 'Scaduta',
};

function KpiCard({ title, value, sub, icon: Icon, trend, color }: {
  title: string; value: string; sub?: string; icon: React.ElementType; trend?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">{trend}</span>
              </div>
            )}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const recentRdo = mockRdO.slice(0, 5);
  const urgentRdo = mockRdO
    .filter((r) => ['nuova', 'in_lavorazione', 'offerta_inviata'].includes(r.stato))
    .sort((a, b) => new Date(a.scadenza).getTime() - new Date(b.scadenza).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Panoramica attività MePA</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Prodotti Attivi" value={mockKpi.prodottiAttivi.toString()} sub={`${mockKpi.prodottiTotali} totali nel catalogo`} icon={Package} color="bg-primary/20 text-primary" trend="+2 questo mese" />
        <KpiCard title="RdO in Scadenza" value={mockKpi.rdoInScadenza.toString()} sub="Nei prossimi 7 giorni" icon={AlertTriangle} color="bg-amber-500/20 text-amber-400" />
        <KpiCard title="Valore Offerte" value={formatCurrency(mockKpi.valoreOfferte)} sub="Offerte attive correnti" icon={TrendingUp} color="bg-emerald-500/20 text-emerald-400" trend="+18% vs mese scorso" />
        <KpiCard title="RdO Aggiudicate" value={mockKpi.rdoVinte.toString()} sub="Anno corrente" icon={Award} color="bg-sky-500/20 text-sky-400" />
        <KpiCard title="Tasso Aggiudicazione" value={`${mockKpi.tassoAggiudicazione.toFixed(1)}%`} sub="Successo gare" icon={TrendingUp} color="bg-violet-500/20 text-violet-400" />
        <KpiCard title="RdO Attive" value={mockRdO.filter((r) => ['nuova', 'in_lavorazione', 'offerta_inviata'].includes(r.stato)).length.toString()} sub="In gestione corrente" icon={ClipboardList} color="bg-orange-500/20 text-orange-400" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Andamento Offerte 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="offGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(252 87% 67%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(252 87% 67%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aggGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                <XAxis dataKey="mese" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 14%)', border: '1px solid hsl(216 34% 17%)', borderRadius: 8 }} labelStyle={{ color: 'hsl(213 31% 91%)' }} formatter={(v: number) => [formatCurrency(v), '']} />
                <Area type="monotone" dataKey="offerte" name="Offerte" stroke="hsl(252 87% 67%)" fill="url(#offGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="aggiudicate" name="Aggiudicate" stroke="#34d399" fill="url(#aggGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary inline-block" />Offerte inviate</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />Aggiudicate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              In Scadenza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentRdo.map((rdo) => {
              const days = daysUntil(rdo.scadenza);
              return (
                <div key={rdo.id} className="rounded-lg bg-muted p-3 space-y-1.5">
                  <p className="text-xs font-mono text-muted-foreground">{rdo.numero}</p>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{rdo.titolo}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{rdo.stazioneAppaltante}</span>
                    <Badge variant={days <= 7 ? 'destructive' : 'warning'} className="text-[10px] ml-1">
                      {days > 0 ? `${days}gg` : 'Scaduta'}
                    </Badge>
                  </div>
                </div>
              );
            })}
            <Link to="/rdo">
              <Button variant="ghost" size="sm" className="w-full text-xs mt-1">Vedi tutte le RdO →</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">RdO Recenti</CardTitle>
          <Link to="/rdo"><Button variant="outline" size="sm">Vedi tutte</Button></Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Numero', 'Titolo', 'Ente', 'Importo', 'Scadenza', 'Stato'].map((h, i) => (
                    <th key={h} className={`text-xs text-muted-foreground font-medium px-6 py-3 ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentRdo.map((rdo) => (
                  <tr key={rdo.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{rdo.numero}</td>
                    <td className="px-6 py-3 text-foreground max-w-xs"><span className="line-clamp-1">{rdo.titolo}</span></td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{rdo.stazioneAppaltante}</td>
                    <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(rdo.importoBase)}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{formatDate(rdo.scadenza)}</td>
                    <td className="px-6 py-3"><Badge variant={rdoStatoVariant[rdo.stato]} className="text-[10px]">{rdoStatoLabels[rdo.stato]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
