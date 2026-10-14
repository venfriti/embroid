'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Attachment = { id: string; filename: string; size: number; created_at: string; created_by: string; removed_at?: string | null; removed_by?: string | null };
type Event = { id: number; action: string; body?: string | null; detail?: string | null; at: string; by: string };
type Note = { id: string; body: string; created_at: string; created_by: string; updated_at: string; updated_by: string; removed_at?: string | null; removed_by?: string | null; attachments: Attachment[]; events: Event[] };

const when = (value: string) => new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' });
const btn = { minHeight: 42, padding: '0 14px', borderRadius: 8, border: '1px solid #0E5C63', background: '#fff', color: '#0E5C63', fontWeight: 600, cursor: 'pointer' } as const;

export default function NotesPanel({ scope, owner, notes, demo = false }: { scope: 'customer' | 'order'; owner: string; notes: Note[]; demo?: boolean }) {
  const router = useRouter(); const [showRemoved, setShowRemoved] = useState(false); const [newBody, setNewBody] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({}); const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const visible = notes.filter(n => showRemoved || !n.removed_at);
  async function request(url: string, init?: RequestInit) {
    const res = await fetch(url, init); const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not save the note'); return data;
  }
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); let added = false;
    try {
      const note = await request('/api/notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scope, owner, body: newBody }) });
      added = true;
      const form = e.currentTarget; const input = form.elements.namedItem('file') as HTMLInputElement; const file = input.files?.[0];
      if (file) { const data = new FormData(); data.set('file', file); await request(`/api/notes/${note.id}/files`, { method: 'POST', body: data }); }
      setNewBody(''); router.refresh();
    } catch (e: any) { setError(added ? `The note was saved, but its attachment was not: ${e.message}` : e.message); if (added) router.refresh(); } finally { setBusy(false); }
  }
  async function save(id: string) {
    setBusy(true); setError(''); try { await request(`/api/notes/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: drafts[id] }) }); setEditing({ ...editing, [id]: false }); router.refresh(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function removeNote(id: string) {
    if (!window.confirm('Mark this note as removed? It will stay in the history.')) return;
    setBusy(true); setError(''); try { await request(`/api/notes/${id}`, { method: 'DELETE' }); router.refresh(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function addFile(id: string, input: HTMLInputElement) {
    const file = input.files?.[0]; if (!file) return;
    setBusy(true); setError(''); try { const data = new FormData(); data.set('file', file); await request(`/api/notes/${id}/files`, { method: 'POST', body: data }); input.value = ''; router.refresh(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function removeFile(noteId: string, fileId: string) {
    if (!window.confirm('Mark this attachment as removed? It will stay in the history.')) return;
    setBusy(true); setError(''); try { await request(`/api/notes/${noteId}/files?file=${encodeURIComponent(fileId)}`, { method: 'DELETE' }); router.refresh(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {demo && <p style={{ margin: 0, color: '#5A3A00', background: '#FDE9B0', padding: 12, borderRadius: 8 }}>This is the demo. Notes and attachments are read-only.</p>}
    {error && <p role="alert" style={{ margin: 0, color: '#8A1C13', background: '#FBE0DC', padding: 12, borderRadius: 8 }}>{error}</p>}
    {!demo && <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', padding: 16, border: '1px solid #DDE2E8', borderRadius: 10 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500 }}>New note<textarea className="i" required maxLength={10000} value={newBody} onChange={e => setNewBody(e.target.value)} placeholder={scope === 'customer' ? 'Preferences, measurements or other details for future orders' : 'Details for this order'} /></label>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}><label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13 }}>Optional attachment<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" /></label><button style={btn} disabled={busy}>Add note</button><span style={{ color: '#4B5563', fontSize: 13 }}>PDF, JPG, PNG or WebP, up to 10 MB</span></div>
    </form>}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 14, color: '#4B5563' }}>{visible.length} {visible.length === 1 ? 'note' : 'notes'}</span><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><input type="checkbox" checked={showRemoved} onChange={e => setShowRemoved(e.target.checked)} />Show removed</label></div>
    {visible.length === 0 && <p style={{ margin: 0, color: '#4B5563', background: '#fff', padding: 18, border: '1px solid #DDE2E8', borderRadius: 10 }}>No notes yet.</p>}
    {visible.map(note => <article key={note.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', padding: 16, border: '1px solid #DDE2E8', borderRadius: 10, opacity: note.removed_at ? .72 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, color: '#4B5563', fontSize: 13 }}><span>Added {when(note.created_at)} by {note.created_by}{note.updated_at !== note.created_at ? ` · Updated ${when(note.updated_at)} by ${note.updated_by}` : ''}</span>{note.removed_at && <strong>Removed {when(note.removed_at)} by {note.removed_by}</strong>}</div>
      {editing[note.id] ? <textarea className="i" maxLength={10000} value={drafts[note.id] ?? note.body} onChange={e => setDrafts({ ...drafts, [note.id]: e.target.value })} /> : <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{note.body}</p>}
      {note.attachments?.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><strong style={{ fontSize: 13 }}>Attachments</strong>{note.attachments.filter(f => showRemoved || !f.removed_at).map(file => <div key={file.id} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 14 }}>
        {file.removed_at ? <span>{file.filename} · Removed by {file.removed_by} on {when(file.removed_at)}</span> : <><a href={`/api/notes/${note.id}/files?file=${encodeURIComponent(file.id)}`} target="_blank" rel="noreferrer">{file.filename}</a><span style={{ color: '#4B5563' }}>{Math.max(1, Math.round(file.size / 1024))} KB</span>{!demo && !note.removed_at && <button type="button" style={{ ...btn, minHeight: 40 }} disabled={busy} onClick={() => removeFile(note.id, file.id)}>Mark removed</button>}</>}
      </div>)}</div>}
      {!demo && !note.removed_at && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {editing[note.id] ? <><button type="button" style={btn} disabled={busy} onClick={() => save(note.id)}>Save changes</button><button type="button" style={btn} onClick={() => setEditing({ ...editing, [note.id]: false })}>Cancel</button></> : <button type="button" style={btn} onClick={() => { setDrafts({ ...drafts, [note.id]: note.body }); setEditing({ ...editing, [note.id]: true }); }}>Edit note</button>}
        <label style={{ ...btn, display: 'inline-flex', alignItems: 'center' }}>Add attachment<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" disabled={busy} onChange={e => addFile(note.id, e.currentTarget)} /></label>
        <button type="button" style={{ ...btn, borderColor: '#8A1C13', color: '#8A1C13' }} disabled={busy} onClick={() => removeNote(note.id)}>Mark note removed</button>
      </div>}
      {note.events?.length > 1 && <details><summary style={{ cursor: 'pointer', color: '#0E5C63', fontSize: 14, fontWeight: 600 }}>History ({note.events.length})</summary><div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0 0 14px', borderLeft: '2px solid #DDE2E8', marginTop: 8 }}>{note.events.map(event => <div key={event.id} style={{ fontSize: 13 }}><strong>{event.action}</strong> · {when(event.at)} by {event.by}{event.detail && ` · ${event.detail}`}{event.body && event.action === 'edited' && <blockquote style={{ margin: '5px 0', whiteSpace: 'pre-wrap', color: '#4B5563' }}>{event.body}</blockquote>}</div>)}</div></details>}
    </article>)}
  </div>;
}
