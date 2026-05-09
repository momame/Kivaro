"use client";

import { useRef, useState } from "react";
import { ScanLine, Loader2, CheckCircle } from "lucide-react";
import { confirmReceipt, incrementScanCount } from "./actions";
import { useRouter } from "next/navigation";

type LineItem = { name: string; quantity: string; unitPrice: string };
type Extracted = { vendor: string; total: string; lineItems: LineItem[] };

interface Props {
  scanUsed: number;
  scanLimit: number;
  scanResetDate: string;
}

export function ScanFlow({ scanUsed, scanLimit, scanResetDate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "uploading" | "extracting" | "review" | "saving" | "done">("idle");
  const [imageUrl, setImageUrl] = useState("");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [error, setError] = useState("");

  const remaining = scanLimit - scanUsed;
  const resetDate = new Date(scanResetDate);
  const nextReset = new Date(resetDate.getFullYear(), resetDate.getMonth() + 1, 1).toLocaleDateString();

  async function handleFile(file: File) {
    if (remaining <= 0) return;
    setError("");
    setStep("uploading");

    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    if (!up.ok) { setError("Upload failed"); setStep("idle"); return; }
    const { url } = await up.json();
    setImageUrl(url);

    setStep("extracting");
    await incrementScanCount();
    const ex = await fetch("/api/extract-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    if (!ex.ok) { setError("Extraction failed"); setStep("idle"); return; }
    const data = await ex.json();
    setExtracted({
      vendor: data.vendor ?? "",
      total: data.total ?? "",
      lineItems: (data.lineItems ?? []).map((i: LineItem) => ({
        name: i.name ?? "",
        quantity: i.quantity ?? "",
        unitPrice: i.unitPrice ?? "",
      })),
    });
    setStep("review");
  }

  async function handleConfirm() {
    if (!extracted) return;
    setStep("saving");
    await confirmReceipt({ imageUrl, ...extracted });
    setStep("done");
    setTimeout(() => { setStep("idle"); setExtracted(null); setImageUrl(""); router.refresh(); }, 2000);
  }

  function updateLineItem(i: number, field: keyof LineItem, value: string) {
    if (!extracted) return;
    const items = [...extracted.lineItems];
    items[i] = { ...items[i], [field]: value };
    setExtracted({ ...extracted, lineItems: items });
  }

  if (step === "done") {
    return (
      <div className="flex items-center gap-2 text-green-600 font-medium">
        <CheckCircle size={20} /> Receipt saved!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Scans this month</p>
          <p className="text-xs text-slate-400">Resets {nextReset}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-800">{remaining}</p>
          <p className="text-xs text-slate-400">of {scanLimit} remaining</p>
        </div>
      </div>

      {remaining <= 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Monthly scan limit reached. Resets {nextReset}.
        </div>
      ) : step === "idle" ? (
        <>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <button onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
            <ScanLine size={20} /> Scan Receipt
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </>
      ) : step === "uploading" || step === "extracting" ? (
        <div className="flex items-center gap-2 text-slate-500 py-4">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">{step === "uploading" ? "Uploading image…" : "Extracting data with AI…"}</span>
        </div>
      ) : step === "review" && extracted ? (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <img src={imageUrl} alt="Receipt" className="w-16 h-16 object-cover rounded border" />
            <h2 className="font-semibold text-slate-800">Review Extracted Data</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Vendor</label>
              <input value={extracted.vendor} onChange={(e) => setExtracted({ ...extracted, vendor: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Total</label>
              <input value={extracted.total} onChange={(e) => setExtracted({ ...extracted, total: e.target.value })}
                type="number" step="0.01" className="w-full border rounded px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Line Items</p>
            <div className="space-y-2">
              {extracted.lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input value={item.name} onChange={(e) => updateLineItem(i, "name", e.target.value)}
                    placeholder="Item" className="border rounded px-2 py-1.5 text-sm col-span-1" />
                  <input value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
                    placeholder="Qty" type="number" step="0.01" className="border rounded px-2 py-1.5 text-sm" />
                  <input value={item.unitPrice} onChange={(e) => updateLineItem(i, "unitPrice", e.target.value)}
                    placeholder="Price" type="number" step="0.01" className="border rounded px-2 py-1.5 text-sm" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleConfirm}
              className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">
              Confirm & Save
            </button>
            <button onClick={() => { setStep("idle"); setExtracted(null); }}
              className="text-sm px-4 py-2 rounded-md border hover:bg-slate-50 transition-colors">
              Discard
            </button>
          </div>
        </div>
      ) : step === "saving" ? (
        <div className="flex items-center gap-2 text-slate-500 py-4">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Saving…</span>
        </div>
      ) : null}
    </div>
  );
}
