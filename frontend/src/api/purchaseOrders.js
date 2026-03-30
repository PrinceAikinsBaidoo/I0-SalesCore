import client from './client'

export const purchaseOrdersApi = {
  getAll: (params) => client.get('/purchase-orders', { params }),
  exportCsv: (params) =>
    client.get('/purchase-orders/export/csv', { params, responseType: 'blob' }),
  getById: (id) => client.get(`/purchase-orders/${id}`),
  getReorderSuggestions: () => client.get('/purchase-orders/reorder-suggestions'),
  create: (data) => client.post('/purchase-orders', data),
  generateFromLowStock: (data) => client.post('/purchase-orders/generate-from-low-stock', data),
  approve: (id) => client.post(`/purchase-orders/${id}/approve`),
  receive: (id, data) => client.post(`/purchase-orders/${id}/receive`, data),
  close: (id) => client.post(`/purchase-orders/${id}/close`),
  cancel: (id, data) => client.post(`/purchase-orders/${id}/cancel`, data ?? {}),
}
