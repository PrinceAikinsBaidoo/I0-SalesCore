import client from './client'

export const usersApi = {
  getAll: () => client.get('/users'),
  getById: (id) => client.get(`/users/${id}`),
  create: (data) => client.post('/users', data),
  deactivate: (id) => client.delete(`/users/${id}`),
}
