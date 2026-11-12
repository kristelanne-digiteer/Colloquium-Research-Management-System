import { supabase, isBackendConfigured } from './supabaseClient';

// Letters the EC Chair sends show up in the author's Notifications page.
// - With Supabase: written to public.notifications (data.letter holds the whole letter).
// - Always: also kept in localStorage so the flow can be demoed with mock data on one browser.

const KEY = 'colloquium-letter-outbox';

const readLocal = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export function getLocalLetterNotifications(email) {
  const e = (email || '').toLowerCase();
  return readLocal().filter((n) => n.recipient_email?.toLowerCase() === e);
}

// Returns { ok, warning? }
export async function sendLetterToAuthor({ letter, signatories, recipientEmail, paper, senderId }) {
  const STATUS_FOR = { ACCEPTED: 'ACCEPTED', REJECTED: 'DECLINED' };
  const note = {
    id: `local-${Date.now()}`,
    recipient_email: recipientEmail,
    type: 'DECISION_LETTER',
    title: letter.heading,
    message: `${letter.badge}: ${paper.title}`,
    data: { letter, signatories, paperId: paper.id },
    is_read: false,
    created_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify([note, ...readLocal()]));
  } catch { /* storage blocked: ignore */ }

  if (!isBackendConfigured) return { ok: true, warning: 'No Supabase configured: saved locally only.' };

  // notifications.user_id is required, and the client cannot read auth.users,
  // so the id is resolved by the find_user_id_by_email() function (see supabase_changes.sql).
  let userId = paper.authorId;
  let lookupError = null;
  if (!userId) {
    const res = await supabase.rpc('find_user_id_by_email', { p_email: recipientEmail });
    userId = res.data;
    lookupError = res.error;
  }
  if (lookupError || !userId) {
    return { ok: true, warning: `Saved locally. No account found for ${recipientEmail}, so no email notification row was created.` };
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    recipient_email: recipientEmail,
    type: note.type,
    title: note.title,
    message: note.message,
    data: note.data,
    send_email: true,
  });
  if (error) return { ok: false, error: error.message };

  if (paper.dbId && STATUS_FOR[letter.template]) {
    await supabase.from('submissions').update({ status: STATUS_FOR[letter.template], updated_at: new Date().toISOString() }).eq('id', paper.dbId);
  }

  // Archive in public.letters only when this paper is a real submissions row.
  if (paper.dbId) {
    const { error: letterError } = await supabase.from('letters').insert({
      submission_id: paper.dbId,
      letter_type: letter.template,
      content: JSON.stringify(letter),
      generated_by: senderId ?? null,
      template_used: letter.template,
      signatories_data: signatories,
      signatory_name: signatories[0]?.full_name ?? null,
      signatory_position: signatories[0]?.position ?? null,
    });
    if (letterError) return { ok: true, warning: `Sent, but not archived in letters: ${letterError.message}` };
  }
  return { ok: true };
}
