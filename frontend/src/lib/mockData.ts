import type { Product, RdO, KpiData } from '../types';

export const mockProducts: Product[] = [
  { id: '1', codiceArticolo: 'IT-SW-001', descrizione: 'Microsoft Office 365 Business Standard', descrizioneTecnica: 'Suite completa di applicazioni per la produttività aziendale. Include Word, Excel, PowerPoint, Teams, SharePoint. 1 anno per utente.', categoria: 'Software', sottocategoria: 'Licenze', prezzoUnitario: 149.00, unitaMisura: 'licenza/anno', iva: 22, cpv: '48000000-8', marca: 'Microsoft', modello: 'Office 365 Business Standard', attivo: true, scorte: 100, tempoConsegna: 1, createdAt: '2024-01-10T10:00:00Z', updatedAt: '2024-03-15T14:30:00Z' },
  { id: '2', codiceArticolo: 'IT-HW-010', descrizione: 'Laptop HP ProBook 450 G10', descrizioneTecnica: 'Notebook professionale 15.6" FHD, Intel Core i5-1335U, 16GB RAM DDR4, SSD 512GB NVMe, Windows 11 Pro.', categoria: 'Hardware', sottocategoria: 'Notebook', prezzoUnitario: 899.00, unitaMisura: 'pz', iva: 22, cpv: '30213100-6', marca: 'HP', modello: 'ProBook 450 G10', attivo: true, scorte: 15, tempoConsegna: 5, createdAt: '2024-01-15T09:00:00Z', updatedAt: '2024-03-10T11:00:00Z' },
  { id: '3', codiceArticolo: 'IT-SRV-003', descrizione: 'Dell PowerEdge R350 Server', descrizioneTecnica: 'Server rack 1U, Intel Xeon E-2314, 32GB ECC RAM, 2x SSD 480GB RAID1, IDRAC9.', categoria: 'Hardware', sottocategoria: 'Server', prezzoUnitario: 3299.00, unitaMisura: 'pz', iva: 22, cpv: '48820000-2', marca: 'Dell', modello: 'PowerEdge R350', attivo: true, scorte: 3, tempoConsegna: 14, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-28T16:00:00Z' },
  { id: '4', codiceArticolo: 'SV-MAINT-005', descrizione: 'Servizio di assistenza tecnica on-site', descrizioneTecnica: 'Contratto di manutenzione hardware/software con intervento entro 4 ore lavorative. Include pezzi di ricambio.', categoria: 'Servizi', sottocategoria: 'Manutenzione', prezzoUnitario: 1200.00, unitaMisura: 'anno', iva: 22, cpv: '72267000-4', attivo: true, tempoConsegna: 0, createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-03-01T09:00:00Z' },
  { id: '5', codiceArticolo: 'IT-NET-008', descrizione: 'Switch Cisco Catalyst 1000-24T', descrizioneTecnica: 'Switch managed Layer 2, 24 porte PoE+ 1GbE, 4 uplink SFP 1G, capacità 56 Gbps.', categoria: 'Networking', sottocategoria: 'Switch', prezzoUnitario: 649.00, unitaMisura: 'pz', iva: 22, cpv: '32420000-3', marca: 'Cisco', modello: 'Catalyst 1000-24T', attivo: true, scorte: 8, tempoConsegna: 7, createdAt: '2024-02-10T14:00:00Z', updatedAt: '2024-03-05T10:00:00Z' },
  { id: '6', codiceArticolo: 'IT-SEC-002', descrizione: 'Antivirus Kaspersky Endpoint Security Cloud', descrizioneTecnica: 'Soluzione di sicurezza endpoint con gestione centralizzata cloud. Protezione ransomware, EDR, controllo web.', categoria: 'Sicurezza', sottocategoria: 'Antivirus', prezzoUnitario: 39.90, unitaMisura: 'nodo/anno', iva: 22, cpv: '72212000-4', marca: 'Kaspersky', attivo: false, scorte: 50, tempoConsegna: 1, createdAt: '2024-01-05T08:00:00Z', updatedAt: '2024-02-14T11:30:00Z' },
];

export const mockRdO: RdO[] = [
  { id: '1', numero: 'RdO-2024-0542', titolo: 'Fornitura 50 Laptop per Polizia Municipale', stazioneAppaltante: 'Comune di Milano', importoBase: 44950.00, scadenza: '2026-06-05', stato: 'in_lavorazione', priorita: 'alta', prodotti: ['2'], note: 'Richiesta consegna entro 30gg dalla firma contratto', createdAt: '2024-03-10T08:00:00Z', updatedAt: '2024-03-15T14:00:00Z' },
  { id: '2', numero: 'RdO-2024-0483', titolo: 'Licenze Office 365 per 200 utenti', stazioneAppaltante: 'ASL Roma 1', importoBase: 29800.00, scadenza: '2026-05-30', stato: 'offerta_inviata', priorita: 'alta', prodotti: ['1'], createdAt: '2024-03-05T09:00:00Z', updatedAt: '2024-03-12T16:00:00Z' },
  { id: '3', numero: 'RdO-2024-0391', titolo: 'Manutenzione infrastruttura IT annuale', stazioneAppaltante: 'Università degli Studi di Bologna', importoBase: 18000.00, scadenza: '2026-07-15', stato: 'nuova', priorita: 'media', prodotti: ['4'], createdAt: '2024-03-01T10:00:00Z', updatedAt: '2024-03-01T10:00:00Z' },
  { id: '4', numero: 'RdO-2024-0278', titolo: 'Fornitura server per datacenter', stazioneAppaltante: 'Regione Lombardia', importoBase: 65980.00, scadenza: '2026-04-20', stato: 'aggiudicata', priorita: 'alta', prodotti: ['3'], createdAt: '2024-02-15T08:00:00Z', updatedAt: '2024-03-18T15:00:00Z' },
  { id: '5', numero: 'RdO-2024-0156', titolo: 'Switch rete campus universitario', stazioneAppaltante: 'Politecnico di Torino', importoBase: 12980.00, scadenza: '2026-03-31', stato: 'scaduta', priorita: 'bassa', prodotti: ['5'], createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-03-31T23:59:59Z' },
  { id: '6', numero: 'TD-2024-0089', titolo: 'Antivirus 300 postazioni - Trattativa Diretta', stazioneAppaltante: 'Camera di Commercio Napoli', importoBase: 11970.00, scadenza: '2026-06-30', stato: 'in_lavorazione', priorita: 'media', prodotti: ['6'], createdAt: '2024-03-08T11:00:00Z', updatedAt: '2024-03-14T09:00:00Z' },
];

export const mockKpi: KpiData = {
  prodottiAttivi: 5,
  rdoInScadenza: 2,
  valoreOfferte: 182680,
  rdoVinte: 1,
  tassoAggiudicazione: 33.3,
  prodottiTotali: 6,
};

export const monthlyData = [
  { mese: 'Gen', offerte: 45000, aggiudicate: 12000 },
  { mese: 'Feb', offerte: 78000, aggiudicate: 65980 },
  { mese: 'Mar', offerte: 182680, aggiudicate: 0 },
  { mese: 'Apr', offerte: 0, aggiudicate: 0 },
  { mese: 'Mag', offerte: 0, aggiudicate: 0 },
  { mese: 'Giu', offerte: 0, aggiudicate: 0 },
];
