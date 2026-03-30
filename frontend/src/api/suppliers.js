import client from './client'

export const suppliersApi = {
  getAll: (params) => client.get('/suppliers', { params }),
  getById: (id) => client.get(`/suppliers/${id}`),
  create: (data) => client.post('/suppliers', data),
  update: (id, data) => client.put(`/suppliers/${id}`, data),
  deactivate: (id) => client.delete(`/suppliers/${id}`),
}
