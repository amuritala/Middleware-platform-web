import { useEffect, useState, type FormEvent } from "react";
import { governanceApi, ApiError, type ApprovalRequest } from "../../../lib/api";

interface VendorRegistrationModalProps {
  onClose: () => void;
  /** Fires after initiation so the list and queue can refresh. */
  onSubmitted: () => void;
}

const FIELDS = [
  { key: "companyName", label: "Company name", placeholder: "Acme Corporation Ltd", required: true },
  { key: "registrationNumber", label: "Registration number", placeholder: "RC-1234567", required: true },
  { key: "industry", label: "Industry", placeholder: "Financial Services", required: true },
  { key: "taxId", label: "Tax ID", placeholder: "TIN-98765432", required: true },
  { key: "country", label: "Country", placeholder: "Sierra Leone", required: false },
  { key: "phoneNumber", label: "Company phone", placeholder: "+23276123456", required: true },
] as const;

/**
 * Initiates a vendor registration. Nothing here creates a usable account: the request
 * lands in the approvals queue, the Keycloak user is created disabled, and only an
 * authorizer's approval makes the vendor active and emails the temporary password.
 */
export default function VendorRegistrationModal({
  onClose,
  onSubmitted,
}: VendorRegistrationModalProps) {
  const [form, setForm] = useState<Record<string, string>>({
    companyName: "",
    registrationNumber: "",
    industry: "",
    taxId: "",
    country: "",
    phoneNumber: "",
    companyAddress: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<ApprovalRequest | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, busy]);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const requiredOk =
    FIELDS.every((field) => !field.required || form[field.key].trim()) &&
    form.companyAddress.trim() &&
    form.contactFirstName.trim() &&
    form.contactLastName.trim() &&
    /\S+@\S+\.\S+/.test(form.contactEmail.trim()) &&
    form.contactPhone.trim();

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!requiredOk) {
      setError("Fill in the required fields (a valid contact email included).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const request = await governanceApi.initiateVendorRegistration({
        ...form,
        comment: comment.trim() || undefined,
      });
      setCreated(request);
      onSubmitted();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.message} (${err.status})`
          : err instanceof Error
            ? err.message
            : "The registration could not be initiated",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 px-7 pt-6 pb-5">
          <div className="absolute -top-16 -right-12 w-52 h-52 rounded-full bg-orange-500/25 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-orange-300 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                Maker-checker
              </span>
              <h2 className="text-xl font-bold text-white mt-2.5">Register a vendor</h2>
              <p className="text-xs text-gray-400 mt-1">
                The vendor stays pending until an authorizer signs this off.
              </p>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-7 overflow-y-auto">
          {created ? (
            <div className="py-8 text-center animate-fade-up">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {form.companyName} is pending authorization
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                The account exists in a disabled state. Once an authorizer (other than you)
                approves the request, the vendor turns active and the temporary password is
                emailed to {form.contactEmail}.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {created.actionLabel} · awaiting decision
              </span>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                  {error}
                </div>
              )}

              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Company details
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FIELDS.map((field) => (
                    <label key={field.key} className={field.key === "companyName" ? "sm:col-span-2" : ""}>
                      <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-orange-500"> •</span>}
                      </span>
                      <input
                        value={form[field.key]}
                        disabled={busy}
                        onChange={(e) => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                      />
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Registered address<span className="text-orange-500"> •</span>
                  </span>
                  <input
                    value={form.companyAddress}
                    disabled={busy}
                    onChange={(e) => set("companyAddress", e.target.value)}
                    placeholder="14 Marina Road, Freetown"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                  />
                </label>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Contact person
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label>
                    <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                      First name<span className="text-orange-500"> •</span>
                    </span>
                    <input
                      value={form.contactFirstName}
                      disabled={busy}
                      onChange={(e) => set("contactFirstName", e.target.value)}
                      placeholder="Jane"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                    />
                  </label>
                  <label>
                    <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Last name<span className="text-orange-500"> •</span>
                    </span>
                    <input
                      value={form.contactLastName}
                      disabled={busy}
                      onChange={(e) => set("contactLastName", e.target.value)}
                      placeholder="Doe"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                    />
                  </label>
                  <label>
                    <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Email<span className="text-orange-500"> •</span>
                    </span>
                    <input
                      type="email"
                      value={form.contactEmail}
                      disabled={busy}
                      onChange={(e) => set("contactEmail", e.target.value)}
                      placeholder="jane@acme-corp.com"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                    />
                  </label>
                  <label>
                    <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Phone<span className="text-orange-500"> •</span>
                    </span>
                    <input
                      value={form.contactPhone}
                      disabled={busy}
                      onChange={(e) => set("contactPhone", e.target.value)}
                      placeholder="+23276123456"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                    />
                  </label>
                </div>
              </fieldset>

              <label className="block">
                <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Comment <span className="text-gray-400 font-normal">(optional)</span>
                </span>
                <textarea
                  rows={2}
                  value={comment}
                  disabled={busy}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Anything the authorizer should know…"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors resize-none"
                />
              </label>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 flex gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-amber-700 leading-relaxed">
                  On submission the vendor is created as <strong>PENDING</strong> with a
                  disabled Keycloak account. Approval makes it active and emails a freshly
                  generated temporary password - shown to nobody.
                </p>
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {created ? "Close" : "Cancel"}
          </button>
          {!created && (
            <button
              type="button"
              onClick={(e) => void submit(e)}
              disabled={busy}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {busy && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {busy ? "Submitting…" : "Submit for approval"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
