import { Moon, Sun, Info, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
export default function Settings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium text-[var(--accent-strong)]">Preferences</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">
          Make Voxora yours
        </h2>
        <p className="mt-1 text-sm text-muted">
          A few controls for your workspace experience.
        </p>
      </div>
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-bold text-ink">Appearance</h3>
          <p className="mt-1 text-xs text-muted">
            Choose how Voxora looks on this device.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 p-5">
          {[
            ["light", Sun, "Light"],
            ["dark", Moon, "Dark"],
          ].map(([value, Icon, label]) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex min-w-32 items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${theme === value ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-line text-muted hover:bg-paper"}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 text-[var(--accent-strong)]" />
          <div>
            <h3 className="text-sm font-bold text-ink">Data & session behavior</h3>
            <p className="mt-2 text-xs leading-5 text-muted">
              The current FastAPI backend stores active sessions and retrieval chains in
              memory. Voxora's meeting library is held in the active frontend workspace
              and is not a persistent archive. Refreshing the page or restarting the
              backend can make old session IDs unusable.
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 text-[var(--accent-strong)]" />
          <div>
            <h3 className="text-sm font-bold text-ink">About Voxora</h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              Meeting and media intelligence · Intelligence in every conversation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
