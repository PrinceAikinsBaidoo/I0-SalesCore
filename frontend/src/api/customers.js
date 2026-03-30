import client from './client'

export const customersApi = {
  getAll: (params) => client.get('/customers', { params }),
  getById: (id) => client.get(`/customers/${id}`),
  getPurchases: (id, params) => client.get(`/customers/${id}/purchases`, { params }),
  create: (data) => client.post('/customers', data),
  update: (id, data) => client.put(`/customers/${id}`, data),
}
