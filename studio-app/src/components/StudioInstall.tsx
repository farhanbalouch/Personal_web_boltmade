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
    ready();
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
          ? "Installation requested. Let Chrome finish, then open Farhan Studio from your phone’s app list."
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
        {isApp ? "Studio app" : available ? "Install Studio app" : "App installation"}
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
          <h2>Install the Studio app</h2>
          <p>
            Open <strong>{window.location.host}/admin/</strong> directly in Chrome or
            Edge.
          </p>
          <p role="status">
            {available ? "Chrome is ready to install the app." : "This browser has not offered its app-install prompt in this tab yet."}
          </p>
          {available && <button type="button" className="studio-primary" onClick={install}>Install Studio app</button>}
          <ol>
            <li>Open this address in a normal <strong>Chrome</strong> tab on Android, outside WhatsApp or another app’s browser.</li>
            <li>Wait for the page to finish loading, then use <strong>Install Studio app</strong> here or Chrome’s <strong>Install app</strong> menu.</li>
            <li>If Chrome only offers <strong>Create shortcut</strong>, cancel it. A shortcut keeps the browser badge.</li>
          </ol>
          <p>On Android, app installation needs a supported browser and device services. Update Chrome and Google Play services if it keeps offering only a shortcut. Samsung phones can also install supported web apps through Samsung Internet.</p>
          <small>Already installed? Open Studio from your app list. An old shortcut does not turn into an installed app automatically. On iPhone: Safari → Share → Add to Home Screen → Open as Web App. Login and publishing need internet.</small>
        </div>
      )}
    </div>
  );
}
