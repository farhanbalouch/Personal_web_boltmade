import { useEffect, useState, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';

const DELAYS = [15, 90, 150]; // seconds — offset from NotifyPopup's timings so they don't both appear together

// IMPORTANT: this is your WhatsApp Business number, in international
// format with no leading + or spaces (e.g. 923093244171 for +92 309 3244171).
const WHATSAPP_NUMBER = '923093244171';

// Meta only allows a business to message someone AFTER that person has
// messaged the business first (or clicked a "click to chat" link like this
// one). So this button doesn't need any API token at all — it just opens
// WhatsApp with a pre-filled message. Once they hit send, they've opted in,
// and your WhatsApp Business number can reply to / notify them going forward.
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Notify me about new blog posts and story updates 🙂'
)}`;

export function WhatsappOpt() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const dismissedForever = useRef(
    typeof window !== 'undefined' && localStorage.getItem('whatsapp_optin_dismissed') === '1'
  );

  useEffect(() => {
    if (dismissedForever.current) return;
    if (stepIndex >= DELAYS.length) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, DELAYS[stepIndex] * 1000);

    return () => clearTimeout(timer);
  }, [stepIndex]);

  const handleClose = () => {
    setVisible(false);
    setStepIndex((i) => i + 1);
  };

  const handleOptIn = () => {
    window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
    localStorage.setItem('whatsapp_optin_dismissed', '1');
    dismissedForever.current = true;
    setVisible(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem('whatsapp_optin_dismissed', '1');
    dismissedForever.current = true;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="notify-popup whatsapp-optin-popup">
      <button className="notify-popup-close" onClick={handleClose} aria-label="Close">
        <X size={16} />
      </button>
      <div className="notify-popup-icon whatsapp-optin-icon">
        <MessageCircle size={22} />
      </div>
      <p className="notify-popup-text">
        Prefer WhatsApp? Get new blog posts and story updates sent straight to your chat.
      </p>
      <div className="notify-popup-actions">
        <button className="notify-popup-allow whatsapp-optin-btn" onClick={handleOptIn}>
          Notify me on WhatsApp
        </button>
        <button className="notify-popup-never" onClick={handleNeverShow}>
          Don't show again
        </button>
      </div>
    </div>
  );
}
