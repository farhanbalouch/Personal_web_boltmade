import { useEffect, useState } from "react";
import { Download, Smartphone, Check, X } from "lucide-react";
import { installed, installAvailable, promptInstall } from "@/lib/studioPwa";
export function StudioInstall() {
  const [isApp, setIsApp] = useState(installed),
    [available, setAvailable] = useState(installAvailable),
    [help, setHelp] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    const ready = () => setAvailable(installAvailable());
    const done = () => {
      setIsApp(true);
      setHelp(false);
    };
    window.addEventListener("studio-install-ready", ready);
    window.addEventListener("studio-installed", done);
    return () => {
      window.removeEventListener("studio-install-ready", ready);
      window.removeEventListener("studio-installed", done);
    };
  }, []);
  async function install() {
    if (!available) {
      setHelp(true);
      return;
    }
    try {
      const accepted = await promptInstall();
      setAvailable(false);
      setMessage(
        accepted
          ? "Installation accepted. Open Farhan Studio from your apps."
          : "You can install later from Chrome’s Install app menu.",
      );
    } catch {
      setMessage(
        "Open this page directly in Chrome, then choose Install Farhan Studio.",
      );
    }
  }
  return (
    <div className="studio-install">
      <button
        type="button"
        onClick={install}
        disabled={isApp}
        className="studio-install-button"
      >
        {isApp ? <Check size={16} /> : <Download size={16} />}
        {isApp ? "Studio app" : "Install Studio app"}
      </button>
      {message && <p role="status">{message}</p>}
      {help && (
        <div
          className="studio-install-help"
          role="dialog"
          aria-modal="false"
          aria-label="Install Farhan Studio"
        >
          <button
            className="studio-install-close"
            type="button"
            aria-label="Close installation guide"
            onClick={() => setHelp(false)}
          >
            <X size={16} />
          </button>
          <Smartphone size={24} />
          <h2>Your own Studio app.</h2>
          <p>
            Open <strong>{window.location.host}/admin/</strong> directly in Chrome or
            Edge.
          </p>
          <ol>
            <li>
              Choose <strong>Install Farhan Studio</strong> from the address bar
              or browser menu.
            </li>
            <li>
              Confirm <strong>Install</strong>.
            </li>
            <li>
              Launch <strong>Farhan Studio</strong> from your phone or
              computer’s apps.
            </li>
          </ol>
          <p>
            Use <strong>Install app</strong>, not “Create shortcut”. On iPhone:
            Safari → Share → Add to Home Screen → Open as Web App.
          </p>
          <small>
            If the install option has not appeared yet, reload this page once.
            Internet is needed to sign in and publish.
          </small>
        </div>
      )}
    </div>
  );
}
