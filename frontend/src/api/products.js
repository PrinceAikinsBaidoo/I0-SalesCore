import client from './client'

export const productsApi = {
  getAll: (params) => client.get('/products', { params }),
  getById: (id) => client.get(`/products/${id}`),
  getByBarcode: (code) => client.get(`/products/barcode/${code}`),
  getLowStock: () => client.get('/products/low-stock'),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  deactivate: (id) => client.delete(`/products/${id}`),
}

export const categoriesApi = {
  getAll: () => client.get('/categories'),
  create: (data) => client.post('/categories', data),
  update: (id, data) => client.put(`/categories/${id}`, data),
  delete: (id) => client.delete(`/categories/${id}`),
}
