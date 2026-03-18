import { useState } from 'react';

const SUPABASE_URL = 'https://kkombjkfxvsradeujjvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrb21iamtmeHZzcmFkZXVqanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Nzk0OTYsImV4cCI6MjA4OTI1NTQ5Nn0.UU-bvzB_R1jUtRI_N7j-P6bxOYEZiutR16JYlRZd2Ks';

export function FeedbackBar() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      setMessage('');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-t border-sky-200 shadow-sm">
      <span className="text-xs text-sky-500 shrink-0">Feedback:</span>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="What do you think? Any bugs or suggestions?"
        className="flex-1 px-2 py-1 text-xs bg-sky-50 border border-sky-300 rounded text-sky-900 placeholder-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
        disabled={status === 'sending'}
      />
      <button
        onClick={handleSubmit}
        disabled={status === 'sending' || !message.trim()}
        className="px-3 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Thanks!' : status === 'error' ? 'Failed' : 'Send'}
      </button>
    </div>
  );
}
