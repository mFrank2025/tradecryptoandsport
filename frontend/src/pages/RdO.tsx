import { useState } from 'react';
import { Plus, Search, ClipboardList, Calendar, Building2, Filter, Edit2, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { mockRdO } from '../lib/mockData';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import type { RdO } from '../types';
import toast from 'react-hot-toast';

const STATO_LABELS: Record<RdO['stato'], string> = {
  nuova: 'Nuova', in_lavorazione: 'In Lavorazione', offerta_inviata: 'Offerta Inviata',
  aggiudicata: 'Aggiudicata', persa: 'Persa', scaduta: 'Scaduta',
};
const STATO_VARIANT: Record<RdO['stato'], 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  nuova: 'info', in_lavorazione: 'warning', offerta_inviata: 'default',
  aggiudicata: 'success', persa: 'destructive', scaduta: 'secondary',
};
const PRIORITA_VARIANT: Record<RdO['priorita'], 'destructive' | 'warning' | 'secondary'> = {
  alta: 'destructive', media: 'warning', bassa: 'secondary',
};

const emptyRdo: Omit<RdO, 'id' | 'createdAt' | 'updatedAt'> = {
  numero: '', titolo: '', stazioneAppaltante: '', importoBase: 0,
  scadenza: '', stato: 'nuova', priorita: 'media', note: '', prodotti: [],
};

export default function RdOPage() {
  const [rdos, setRdos] = useState<RdO[]>(mockRdO);
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState('tutti');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRdo, setEditRdo] = useState<RdO | null>(null);
  const [form, setForm] = useState<typeof emptyRdo>(emptyRdo);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewRdo, setViewRdo] = useState<RdO | null>(null);

  const filtered = rdos.filter((r) => {
    const matchS = r.titolo.toLowerCase().includes(search.toLowerCase()) ||
      r.numero.toLowerCase().includes(search.toLowerCase()) ||
      r.stazioneAppaltante.toLowerCase().includes(search.toLowerCase());
    const matchF = filterStato === 'tutti' || r.stato === filterStato;
    return matchS && matchF;
  });

  const openNew = () => { setEditRdo(null); setForm(emptyRdo); setDialogOpen(true); };
  const openEdit = (r: RdO) => {
    setEditRdo(r);
    const { id, createdAt, updatedAt, ...rest } = r;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.numero || !form.titolo || !form.scadenza) {
      toast.error('Numero, titolo e scadenza sono obbligatori');
      return;
    }
    if (editRdo) {
      setRdos((rs) => rs.map((r) => r.id === editRdo.id ? { ...editRdo, ...form, updatedAt: new Date().toISOString() } : r));
      toast.success('RdO aggiornata');
    } else {
      const newR: RdO = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setRdos((rs) => [newR, ...rs]);
      toast.success('RdO creata');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setRdos((rs) => rs.filter((r) => r.id !== id));
    setDeleteId(null);
    toast.success('RdO eliminata');
  };

  const stats = {
    attive: rdos.filter((r) => ['nuova', 'in_lavorazione', 'offerta_inviata'].includes(r.stato)).length,
    aggiudicate: rdos.filter((r) => r.stato === 'aggiudicata').length,
    valore: rdos.filter((r) => ['nuova', 'in_lavorazione', 'offerta_inviata'].includes(r.stato)).reduce((s, r) => s + r.importoBase, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">RdO & Trattative Dirette</h1>
          <p className="text-muted-foreground text-sm mt-1">{rdos.length} totali · {stats.attive} attive</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" />Nuova RdO</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'RdO Attive', value: stats.attive.toString(), color: 'text-primary' },
          { label: 'Aggiudicate', value: stats.aggiudicate.toString(), color: 'text-emerald-400' },
          { label: 'Valore in gara', value: formatCurrency(stats.valore), color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca RdO..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStato} onValueChange={setFilterStato}>
          <SelectTrigger className="w-44">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli stati</SelectItem>
            {(Object.entries(STATO_LABELS) as [RdO['stato'], string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Nessuna RdO trovata</p>
          </div>
        ) : filtered.map((rdo) => {
          const days = daysUntil(rdo.scadenza);
          return (
            <Card key={rdo.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATO_VARIANT[rdo.stato]} className="text-[10px]">{STATO_LABELS[rdo.stato]}</Badge>
                    <Badge variant={PRIORITA_VARIANT[rdo.priorita]} className="text-[10px] capitalize">{rdo.priorita}</Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewRdo(rdo)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rdo)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(rdo.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs font-mono text-muted-foreground mb-1">{rdo.numero}</p>
                <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-3">{rdo.titolo}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{rdo.stazioneAppaltante}</span>
                  </span>
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(rdo.scadenza)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">{formatCurrency(rdo.importoBase)}</span>
                  {rdo.stato !== 'aggiudicata' && rdo.stato !== 'persa' && rdo.stato !== 'scaduta' && (
                    <Badge variant={days <= 3 ? 'destructive' : days <= 7 ? 'warning' : 'secondary'} className="text-[10px]">
                      {days > 0 ? `Scade in ${days}gg` : 'Scaduta'}
                    </Badge>
                  )}
                </div>
                {/* Quick state change */}
                <div className="mt-3 pt-3 border-t border-border flex gap-2">
                  {rdo.stato === 'nuova' && (
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => setRdos((rs) => rs.map((r) => r.id === rdo.id ? { ...r, stato: 'in_lavorazione' as RdO['stato'] } : r))}>
                      Inizia lavorazione
                    </Button>
                  )}
                  {rdo.stato === 'in_lavorazione' && (
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => setRdos((rs) => rs.map((r) => r.id === rdo.id ? { ...r, stato: 'offerta_inviata' as RdO['stato'] } : r))}>
                      Segna offerta inviata
                    </Button>
                  )}
                  {rdo.stato === 'offerta_inviata' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-7 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10" onClick={() => { setRdos((rs) => rs.map((r) => r.id === rdo.id ? { ...r, stato: 'aggiudicata' as RdO['stato'] } : r)); toast.success('Congratulazioni! RdO aggiudicata'); }}>
                        Aggiudicata
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-7 text-red-400 border-red-400/30 hover:bg-red-400/10" onClick={() => setRdos((rs) => rs.map((r) => r.id === rdo.id ? { ...r, stato: 'persa' as RdO['stato'] } : r))}>
                        Persa
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openEdit(rdo)}>
                    <Edit2 className="h-3 w-3 mr-1" />Modifica
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRdo ? 'Modifica RdO' : 'Nuova RdO'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Numero RdO *</Label>
              <Input value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} placeholder="RdO-2024-0001" />
            </div>
            <div className="space-y-1.5">
              <Label>Scadenza *</Label>
              <Input type="date" value={form.scadenza?.split('T')[0]} onChange={(e) => setForm((f) => ({ ...f, scadenza: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Titolo *</Label>
              <Input value={form.titolo} onChange={(e) => setForm((f) => ({ ...f, titolo: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Stazione Appaltante</Label>
              <Input value={form.stazioneAppaltante} onChange={(e) => setForm((f) => ({ ...f, stazioneAppaltante: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Importo Base (€)</Label>
              <Input type="number" min={0} step={0.01} value={form.importoBase} onChange={(e) => setForm((f) => ({ ...f, importoBase: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Priorità</Label>
              <Select value={form.priorita} onValueChange={(v: RdO['priorita']) => setForm((f) => ({ ...f, priorita: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="bassa">Bassa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stato</Label>
              <Select value={form.stato} onValueChange={(v: RdO['stato']) => setForm((f) => ({ ...f, stato: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATO_LABELS) as [RdO['stato'], string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Note</Label>
              <Textarea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave}>{editRdo ? 'Salva' : 'Crea RdO'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Elimina RdO</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Sei sicuro? L'operazione non è reversibile.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annulla</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Elimina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewRdo && (
        <Dialog open={!!viewRdo} onOpenChange={() => setViewRdo(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{viewRdo.numero}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="font-semibold text-foreground">{viewRdo.titolo}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Ente</p><p className="font-medium">{viewRdo.stazioneAppaltante}</p></div>
                <div><p className="text-xs text-muted-foreground">Importo</p><p className="font-medium">{formatCurrency(viewRdo.importoBase)}</p></div>
                <div><p className="text-xs text-muted-foreground">Scadenza</p><p className="font-medium">{formatDate(viewRdo.scadenza)}</p></div>
                <div><p className="text-xs text-muted-foreground">Stato</p><Badge variant={STATO_VARIANT[viewRdo.stato]}>{STATO_LABELS[viewRdo.stato]}</Badge></div>
              </div>
              {viewRdo.note && <div><p className="text-xs text-muted-foreground mb-1">Note</p><p className="text-sm bg-muted rounded p-2">{viewRdo.note}</p></div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewRdo(null)}>Chiudi</Button>
              <Button onClick={() => { openEdit(viewRdo); setViewRdo(null); }}>Modifica</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
