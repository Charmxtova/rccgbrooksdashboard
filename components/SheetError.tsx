import { SHEET_ID, SHEET_URL } from "@/lib/sheets";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

/**
 * Shown by both pages when the workbook cannot be read. It carries the theme
 * toggle because this screen replaces the whole dashboard, header and all, so
 * without it there would be no way to change theme while the sheet is down.
 */
export default function SheetError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Logo className="mb-8" />

      <div className="card border-rose-200 bg-rose-50 p-6 dark:border-rose-500/30 dark:bg-rose-500/10">
        <h1 className="text-base font-semibold text-rose-900 dark:text-rose-200">
          Could not load the attendance sheet
        </h1>
        <p className="mt-2 text-sm text-rose-800 dark:text-rose-200/90">{message}</p>
        {SHEET_ID && (
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-medium text-rose-900 underline dark:text-rose-200"
          >
            Open the sheet
          </a>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <ThemeToggle showLabel />
      </div>
    </main>
  );
}
