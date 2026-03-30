import client from './client'

export const inventoryApi = {
  getLogs: (params) => client.get('/inventory/logs', { params }),
  adjust: (data) => client.post('/inventory/adjust', data),
  getRestocks: (params) => client.get('/inventory/restocks', { params }),
  restock: (data) => client.post('/inventory/restock', data),
}
