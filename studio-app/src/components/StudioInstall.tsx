import { useEffect, useRef, useState } from "react";
import { Download, Smartphone, Check, X } from "lucide-react";
import { installed, installAvailable, promptInstall } from "@/lib/studioPwa";
import { collectInstallReport, type InstallReport } from "@/lib/installDiagnostics";

export function StudioInstall() {
  const [isApp, setIsApp] = useState(installed);
  const [available, setAvailable] = useState(installAvailable);
  const [help, setHelp] = useState(() => new URLSearchParams(location.search).get("install-check") === "1");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<InstallReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const reportText = useRef<HTMLTextAreaElement>(null);
  const checkGeneration = useRef(0);

  useEffect(() => {
    const ready = () => setAvailable(installAvailable());
    const appWindow = () => setIsApp(installed());
    const done = () => {
      // Chrome can fire appinstalled when it hands off installation. It is not
      // independent proof that an Android WebAPK was successfully installed.
      ready();
      appWindow();
      setMessage("Chrome reported completion. Confirm Farhan Studio in Settings → Apps; a home-screen icon alone does not confirm installation.");
    };
    const mode = window.matchMedia("(display-mode: standalone)");
    ready();
    window.addEventListener("studio-install-ready", ready);
    window.addEventListener("studio-installed", done);
    window.addEventListener("focus", appWindow);
    mode.addEventListener("change", appWindow);
    return () => {
      checkGeneration.current++;
      window.removeEventListener("studio-install-ready", ready);
      window.removeEventListener("studio-installed", done);
      window.removeEventListener("focus", appWindow);
      mode.removeEventListener("change", appWindow);
    };
  }, []);

  async function checkInstallation() {
    const generation = ++checkGeneration.current;
    setChecking(true);
    setCopyMessage("");
    try {
      const value = await collectInstallReport();
      if (generation === checkGeneration.current) setReport(value);
    } catch {
      if (generation === checkGeneration.current) setMessage("The installation check could not finish. Keep this page open and run the check again.");
    } finally {
      if (generation === checkGeneration.current) setChecking(false);
    }
  }

  useEffect(() => {
    if (!help) return;
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    void checkInstallation();
  }, [help]);

  async function install() {
    if (!available) { setHelp(true); return; }
    try {
      const accepted = await promptInstall();
      setAvailable(false);
      setMessage(accepted
        ? "Install request accepted. Android app installation still needs to finish. Verify it in Settings → Apps."
        : "Installation cancelled. You can try again from Chrome’s Install app menu.");
      if (help) void checkInstallation();
    } catch {
      setMessage("Chrome could not open the install prompt. Use Installation check to inspect this browser’s setup.");
      setHelp(true);
    }
  }

  async function copyReport() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopyMessage("Report copied. Paste it into your support chat.");
    } catch {
      reportText.current?.focus();
      reportText.current?.select();
      setCopyMessage("Select and copy the report below.");
    }
  }

  return (
    <div className="studio-install">
      <button type="button" onClick={install} disabled={isApp} className="studio-install-button">
        {isApp ? <Check size={16} /> : <Download size={16} />}
        {isApp ? "Studio app window" : available ? "Install Studio app" : "App installation"}
      </button>
      {message && <p className="studio-install-message" role="status">{message}</p>}
      {help && (
        <dialog ref={dialog} className="studio-install-dialog" aria-labelledby="studio-install-title" onCancel={() => setHelp(false)} onClose={() => setHelp(false)}>
          <button type="button" className="studio-install-close" aria-label="Close installation check" onClick={() => setHelp(false)}><X size={18} /></button>
          <Smartphone size={24} />
          <h2 id="studio-install-title">Installation check</h2>
          <p>App drawer mein Studio chahiye, Chrome shortcut nahi. Yeh check website ki files aur isi browser ka install status dekhta hai.</p>
          {available && <button type="button" className="studio-primary" onClick={install}>Install Studio app</button>}
          <div className="studio-install-actions">
            <button type="button" className="studio-secondary" onClick={checkInstallation} disabled={checking}>{checking ? "Checking this browser…" : "Check again"}</button>
            <button type="button" className="studio-secondary" onClick={copyReport} disabled={!report || checking}>Copy report</button>
          </div>
          <div role="status" aria-live="polite">
            {checking ? <p>Checking public app files, offline screen and installed-app detection…</p> : report && <p className="studio-install-summary">{report.summary}</p>}
            {copyMessage && <p>{copyMessage}</p>}
          </div>
          {report && <>
            <dl className="studio-install-results">
              <div><dt>Browser</dt><dd>{report.browser} · {report.android}</dd></div>
              <div><dt>Installed app</dt><dd>{report.installedApp === "detected" ? "Reported by browser" : report.installedApp === "not-reported" ? "Not reported by browser" : "Cannot confirm from this browser"}</dd></div>
              {report.checks.map((check, index) => <div key={index}><dt>{check.name}</dt><dd data-result={check.status}>{check.status.toUpperCase()} · {check.detail}</dd></div>)}
            </dl>
            <details>
              <summary>Report details</summary>
              <textarea ref={reportText} readOnly aria-label="Installation diagnostic report" value={JSON.stringify(report, null, 2)} rows={8} />
            </details>
          </>}
          <p className="studio-install-note">No password, token or draft data is included. The report stays in this browser until you copy and share it.</p>
          <details className="studio-install-next">
            <summary>Install accepted, but only a shortcut appeared?</summary>
            <p>The browser may have failed to create or install the Android app package. A website cannot read that private installer error. “Install accepted” is not proof of success.</p>
            <p>Chrome has no general one-PWA-only limit. Keep your working SARAS installation.</p>
            <p>For the next diagnostic, type <code>chrome://webapks</code> directly into Chrome’s address bar to see registered web apps. Copying the website check report alone does not expose Chrome’s native installer log.</p>
          </details>
          <small>On iPhone: Safari → Share → Add to Home Screen. Login and publishing require internet.</small>
        </dialog>
      )}
    </div>
  );
}
