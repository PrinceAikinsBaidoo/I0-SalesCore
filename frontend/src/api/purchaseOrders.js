import client from './client'

export const purchaseOrdersApi = {
  getAll: (params) => client.get('/purchase-orders', { params }),
  getById: (id) => client.get(`/purchase-orders/${id}`),
  create: (data) => client.post('/purchase-orders', data),
  approve: (id) => client.post(`/purchase-orders/${id}/approve`),
  receive: (id, data) => client.post(`/purchase-orders/${id}/receive`, data),
}
