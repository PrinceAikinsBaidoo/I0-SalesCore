import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, Loader2 } from 'lucide-react'

/**
 * Camera barcode scanner modal using html5-qrcode.
 * onScan(code) is called when a code is successfully decoded.
 */
export default function BarcodeScannerModal({ onScan, onClose }) {
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(true)
  const scannerRef = useRef(null)
  const elementId = 'barcode-scanner-region'

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) {
          setError('No camera found on this device.')
          setStarting(false)
          return
        }
        // Prefer rear camera
        const cam = cameras.find(c => /back|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1]
        return scanner.start(
          cam.id,
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decodedText) => {
            onScan(decodedText)
          },
          () => {} // suppress per-frame errors
        )
      })
      .then(() => setStarting(false))
      .catch((err) => {
        setError(err?.message ?? 'Camera access denied.')
        setStarting(false)
      })

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {})
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-blue-500" />
            <h2 className="font-semibold text-slate-900 text-sm">Scan Barcode</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-4">
          {starting && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Starting camera…</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-red-400 text-center px-4">
              <Camera size={32} className="opacity-40" />
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs text-slate-400">
                Make sure you allowed camera access. You can also type the barcode manually.
              </p>
            </div>
          )}
          <div id={elementId} className={starting || error ? 'hidden' : 'rounded-xl overflow-hidden'} />
          {!starting && !error && (
            <p className="text-xs text-center text-slate-400 mt-3">
              Point the camera at a barcode to scan it automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
