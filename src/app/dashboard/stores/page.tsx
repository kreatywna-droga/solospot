'use client';

import { useEffect, useState } from 'react';
import { Plus, Store as StoreIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  createdAt: string;
}

function statusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return <Badge variant="success" dot>AKTYWNY</Badge>;
    case 'CREATED':
    case 'PROVISIONING': return <Badge variant="warning" dot>OCZEKUJĄCY</Badge>;
    case 'SUSPENDED': return <Badge variant="danger" dot>ZAWIESZONY</Badge>;
    default: return <Badge variant="default" dot>{status}</Badge>;
  }
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.status === 403) {
        setError('Zaloguj się, aby zarządzać sklepami');
        return;
      }
      const d = await res.json();
      if (!d.success) {
        setError(d.error || 'Nie udało się załadować sklepów');
        return;
      }
      setStores(d.stores);
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'),
          domain: newDomain || undefined,
        }),
      });
      const d = await res.json();
      if (!d.success) {
        alert(d.error || 'Nie udało się utworzyć sklepu');
        return;
      }
      setShowCreate(false);
      setNewName('');
      setNewSlug('');
      setNewDomain('');
      await load();
    } catch {
      alert('Błąd podczas tworzenia sklepu');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <PageLoading />;

  if (error) {
    return (
      <PageContainer>
        <EmptyState
          icon={<StoreIcon className="w-12 h-12 text-red-400" />}
          title="Brak dostępu"
          description={error}
          action={{ label: 'Zaloguj się', onClick: () => window.location.href = '/login' }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Moje sklepy"
        description="Zarządzaj swoimi sklepami internetowymi"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Nowy sklep
          </Button>
        }
      />

      {stores.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="w-12 h-12" />}
          title="Brak sklepów"
          description="Utwórz pierwszy sklep, aby rozpocząć sprzedaż."
          action={{ label: 'Utwórz sklep', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid gap-4">
          {stores.map((s) => (
            <Card key={s.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-white/5 flex items-center justify-center">
                    <StoreIcon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{s.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="font-mono">{s.slug}</span>
                      {s.domain && <span>{s.domain}</span>}
                      <span className="text-[10px] text-slate-600">
                        Utworzono: {new Date(s.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {statusBadge(s.status)}
                  <a
                    href={`/store/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href={`/dashboard/stores/${s.id}`}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Zarządzaj →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nowy sklep">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nazwa sklepu</label>
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Mój sklep"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Slug (identyfikator URL)</label>
            <Input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder={newName.toLowerCase().replace(/\s+/g, '-') || 'moj-sklep'}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Domena (opcjonalna)</label>
            <Input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="mojsklep.pl"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
              Anuluj
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              {creating ? 'Tworzenie...' : 'Utwórz'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
