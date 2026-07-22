'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShieldCheck, CreditCard, Activity, Search, 
  MoreVertical, LogOut, Download, CheckCircle2, 
  XCircle, Smartphone, X, Plus, Calendar, TrendingUp, DollarSign, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

// Przykładowe dane użytkowników
const MOCK_USERS = [
  { id: '1', email: 'jan@example.com', plan: 'Dożywotni', status: 'Aktywna', devices: 2, joinDate: '2026-06-25' },
  { id: '2', email: 'anna@nowak.pl', plan: 'Miesięczny', status: 'Aktywna', devices: 1, joinDate: '2026-06-28' },
  { id: '3', email: 'kamil@test.com', plan: 'Roczny', status: 'Wygasła', devices: 0, joinDate: '2025-05-10' },
  { id: '4', email: 'kreatywna.droga@gmail.com', plan: 'Dożywotni (Admin)', status: 'Aktywna', devices: 3, joinDate: '2026-05-01' },
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0e] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#111118] border border-white/10 p-8 rounded-3xl relative z-10 shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">Panel Administratora</h1>
          <p className="text-center text-slate-400 text-sm mb-8">Dostęp tylko dla autoryzowanego personelu.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                placeholder="Wprowadź tajne hasło..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-xs text-center">Nieprawidłowe hasło. Spróbuj ponownie.</p>}
            <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors">
              Zaloguj do centrali
            </button>
            <Link href="/" className="block text-center text-sm text-slate-500 hover:text-white mt-4">Wróc na stronę główną</Link>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#111118] hidden md:flex flex-col relative z-20">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-red-500" />
          <span className="font-bold tracking-widest text-sm uppercase text-slate-300">Panel Admina</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Users className="w-5 h-5" /> Użytkownicy
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'stats' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Activity className="w-5 h-5" /> Statystyki i Raporty
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Wyloguj
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[150px] rounded-full pointer-events-none" />
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-1">
              {activeTab === 'users' ? 'Baza Użytkowników' : 'Raporty i Statystyki'}
            </h1>
            <p className="text-slate-400 text-sm">Witaj Szefie. Masz pełną kontrolę nad systemem.</p>
          </div>
          
          {activeTab === 'users' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Szukaj po e-mailu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#111118] border border-white/10 rounded-full text-sm focus:outline-none focus:border-red-500 w-full md:w-64"
              />
            </div>
          )}
        </header>

        {activeTab === 'users' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
              {[
                { title: 'Całkowita Sprzedaż', value: '4 250 zł', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { title: 'Aktywne Licencje', value: '142', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { title: 'Pobrania APK', value: '890', icon: Download, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { title: 'Nowi w tym tyg.', value: '+12', icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#111118] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <h3 className="text-slate-400 text-sm font-medium mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#111118] border border-white/5 rounded-3xl overflow-hidden relative z-10 shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold">Zarządzanie Użytkownikami</h2>
                <button 
                  onClick={() => setIsLicenseModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Wygeneruj licencję z palca
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-slate-500">
                      <th className="p-4 pl-6 font-medium">Adres E-mail</th>
                      <th className="p-4 font-medium">Plan (Licencja)</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Urządzenia</th>
                      <th className="p-4 font-medium">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    {MOCK_USERS.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 pl-6 font-medium text-slate-300">{user.email}</td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                            {user.plan}
                          </span>
                        </td>
                        <td className="p-4">
                          {user.status === 'Aktywna' ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Aktywna
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
                              <XCircle className="w-3 h-3" /> Wygasła
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Smartphone className="w-4 h-4" /> {user.devices} / 3
                          </div>
                        </td>
                        <td className="p-4">
                          <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6 relative z-10">
            {/* Widok Statystyk i Raportów */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#111118] p-6 rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> Wzrost Użytkowników
                </h3>
                <div className="h-48 flex items-end justify-between gap-2">
                  {[40, 60, 45, 80, 50, 90, 70].map((height, i) => (
                    <div key={i} className="w-full bg-red-500/10 rounded-t-lg relative group">
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-4">
                  <span>Pon</span><span>Wto</span><span>Śro</span><span>Czw</span><span>Pią</span><span>Sob</span><span>Nie</span>
                </div>
              </div>
              
              <div className="bg-[#111118] p-6 rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" /> Ostatnie Płatności (1koszyk)
                </h3>
                <div className="space-y-4">
                  {[
                    { email: 'nowy@test.pl', amount: '199 zł', date: 'Dzisiaj, 14:20' },
                    { email: 'mama2026@gmail.com', amount: '39 zł', date: 'Wczoraj, 19:45' },
                    { email: 'tata.kasia@wp.pl', amount: '99 zł', date: 'Wczoraj, 08:15' },
                  ].map((tx, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <div>
                        <p className="font-medium text-sm text-slate-300">{tx.email}</p>
                        <p className="text-xs text-slate-500">{tx.date}</p>
                      </div>
                      <span className="font-bold text-emerald-400">+{tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-[#111118] p-6 rounded-3xl border border-white/5">
              <h3 className="text-lg font-bold mb-4">Logi Systemowe (Monitoring)</h3>
              <div className="font-mono text-xs text-slate-400 space-y-2 bg-[#0a0a0e] p-4 rounded-xl h-32 overflow-y-auto">
                <p><span className="text-emerald-400">[INFO]</span> 2026-06-30 19:15:20 - Utworzono nową licencję dla: nowy@test.pl</p>
                <p><span className="text-yellow-400">[WARN]</span> 2026-06-30 18:02:11 - Zbyt wiele prób logowania z IP: 192.168.1.10</p>
                <p><span className="text-emerald-400">[INFO]</span> 2026-06-30 15:30:00 - Pomyślnie zaktualizowano wersję APK: v1.0.4</p>
                <p><span className="text-emerald-400">[INFO]</span> 2026-06-30 14:12:05 - Pobrano APK przez użytkownika: mama2026@gmail.com</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Generowanie licencji */}
      <AnimatePresence>
        {isLicenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsLicenseModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#111118] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <button onClick={() => setIsLicenseModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
              
              <h2 className="text-2xl font-bold mb-2">Generuj Licencję Premium</h2>
              <p className="text-slate-400 text-sm mb-6">Dodaj ręczny dostęp dla użytkownika z pominięciem bramki 1koszyk.</p>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsLicenseModalOpen(false); }}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Adres E-mail użytkownika</label>
                  <input type="email" placeholder="np. tester@gmail.com" required className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rodzaj Planu</label>
                  <select className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 appearance-none">
                    <option>Plan Dożywotni</option>
                    <option>Plan Miesięczny</option>
                    <option>Plan Roczny</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsLicenseModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors">Anuluj</button>
                  <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors shadow-lg shadow-red-600/20">Nadaj Dostęp</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
