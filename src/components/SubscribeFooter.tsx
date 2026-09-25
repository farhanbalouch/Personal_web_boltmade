import { useState } from 'react';
import { Mail, Check } from 'lucide-react';

const FORMSPREE_URL = 'https://formspree.io/f/maendpbk'; // <-- yahan apna ID daalo

export function SubscribeFooter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog-subscribe-footer' }),
      });
      if (res.ok) {
        setStatus('done');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="subscribe-footer">
      <p className="subscribe-footer-title">
        <Mail size={16} /> Get new blog posts in your inbox
      </p>
      <form onSubmit={handleSubmit} className="subscribe-footer-form">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'done'}
        />
        <button type="submit" disabled={status === 'loading' || status === 'done'}>
          {status === 'done' ? <Check size={16} /> : 'Subscribe'}
        </button>
      </form>
      {status === 'done' && <p className="subscribe-footer-msg">You're subscribed 🎉</p>}
      {status === 'error' && <p className="subscribe-footer-msg error">Something went wrong, try again.</p>}
    </div>
  );
}
