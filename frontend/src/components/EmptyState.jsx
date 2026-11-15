import { AudioWaveform } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/70 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sage-pale text-sage-deep dark:bg-[#29352B] dark:text-[#C7D5C1]">
        <AudioWaveform size={22} />
      </div>
      <h2 className="mt-4 font-display text-base font-bold text-ink">
        {title || "Nothing here just yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        {description ||
          "Add a recording first. Your notes and insights will appear here."}
      </p>
      <Link
        to="/transcribe"
        className="mt-5 rounded-xl bg-sage px-4 py-2.5 text-xs font-semibold text-white hover:bg-sage-deep"
      >
        Add a recording
      </Link>
    </div>
  );
}
