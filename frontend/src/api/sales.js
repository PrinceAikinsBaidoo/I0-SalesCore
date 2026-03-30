import client from './client'

export const salesApi = {
  getAll: (params) => client.get('/sales', { params }),
  getRefundHistory: (params) => client.get('/sales/refunds', { params }),
  exportRefundHistoryCsv: (params) => client.get('/sales/refunds/export/csv', { params, responseType: 'blob' }),
  getById: (id) => client.get(`/sales/${id}`),
  getReceipt: (id) => client.get(`/sales/${id}/receipt`),
  getPayments: (id) => client.get(`/sales/${id}/payments`),
  refund: (id, data) => client.post(`/sales/${id}/refund`, data),
  create: (data) => client.post('/sales', data),
}

export const reportsApi = {
  daily: () => client.get('/reports/sales/daily'),
  weekly: () => client.get('/reports/sales/weekly'),
  range: (from, to) => client.get('/reports/sales/range', { params: { from, to } }),
  topProducts: (params) => client.get('/reports/products/top', { params }),
  inventory: () => client.get('/reports/inventory'),
  cashiers: (params) => client.get('/reports/cashiers', { params }),
  supplierSummary: (params) => client.get('/reports/suppliers/summary', { params }),
  topSuppliers: (params) => client.get('/reports/suppliers/top', { params }),
  exportTopSuppliersCsv: (params) => client.get('/reports/suppliers/export/csv', { params, responseType: 'blob' }),
}
