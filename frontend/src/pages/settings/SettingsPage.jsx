import { useAuth } from '@/contexts/AuthContext'
import { backupApi } from '@/api/backup'
import { Download, Database, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [busy, setBusy] = useState('')
  const [importFile, setImportFile] = useState(null)

  const extractFilename = (contentDisposition, fallback) => {
    const match = /filename="([^"]+)"/i.exec(contentDisposition || '')
    return match?.[1] || fallback
  }

  const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadJsonBackup = async () => {
    setBusy('json')
    try {
      const res = await backupApi.exportJson()
      const filename = extractFilename(res.headers['content-disposition'], 'salescore-backup.json')
      saveBlob(res.data, filename)
      toast.success('JSON backup downloaded')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to export JSON backup')
    } finally {
      setBusy('')
    }
  }

  const downloadCsv = async (entity) => {
    setBusy(entity)
    try {
      const res = await backupApi.exportCsv(entity)
      const filename = extractFilename(res.headers['content-disposition'], `salescore-${entity}.csv`)
      saveBlob(res.data, filename)
      toast.success(`${entity} CSV downloaded`)
    } catch (err) {
      toast.error(err.response?.data?.message ?? `Failed to export ${entity} CSV`)
    } finally {
      setBusy('')
    }
  }

  const csvEntities = [
    'users',
    'categories',
    'products',
    'customers',
    'sales',
    'sale_items',
    'payments',
    'inventory_logs',
  ]

  const importBackup = async () => {
    if (!importFile) {
      toast.error('Choose a JSON backup file first')
      return
    }
    setBusy('import')
    try {
      const { data } = await backupApi.importJson(importFile)
      toast.success(`Import complete: ${data.salesImported} sales, ${data.paymentsImported} payments, ${data.inventoryLogsImported} inventory logs`)
      setImportFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to import backup')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">System Information</h2>
        <div className="space-y-3">
          {[
            { label: 'System', value: 'I0 SalesCore v1.0' },
            { label: 'Developed by', value: 'I0 LABS' },
            { label: 'Logged in as', value: `${user?.fullName} (${user?.role})` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-medium text-slate-900">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Role Policy</p>
          <p className="text-sm text-slate-600">
            Cashiers handle day-to-day sales. Managers support operations and can sell when needed.
            Admin access to POS is retained for fallback/testing only.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">Backup & Export</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Download full backups, export CSV data, or restore from a JSON backup file.
        </p>

        <button
          onClick={downloadJsonBackup}
          disabled={busy !== ''}
          className="press-feedback inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download size={14} />
          {busy === 'json' ? 'Preparing JSON...' : 'Download Full JSON Backup'}
        </button>

        <div className="mt-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">CSV Exports</p>
          <div className="flex flex-wrap gap-2">
            {csvEntities.map((entity) => (
              <button
                key={entity}
                onClick={() => downloadCsv(entity)}
                disabled={busy !== ''}
                className="press-feedback px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {busy === entity ? `Preparing ${entity}...` : entity}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Restore From JSON</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:border file:border-slate-200 file:rounded-lg file:bg-white file:text-slate-700"
            />
            <button
              onClick={importBackup}
              disabled={busy !== '' || !importFile}
              className="press-feedback inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Upload size={14} />
              {busy === 'import' ? 'Importing...' : 'Import JSON Backup'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Import runs as a merge recovery (existing records are kept, missing records are added/updated).
          </p>
        </div>
      </div>
    </div>
  )
}
