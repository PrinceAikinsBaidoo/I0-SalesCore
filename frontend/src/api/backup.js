import client from './client'

export const backupApi = {
  exportJson: () => client.get('/backup/export/json', { responseType: 'blob' }),
  exportCsv: (entity) => client.get('/backup/export/csv', {
    params: { entity },
    responseType: 'blob',
  }),
  importJson: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/backup/import/json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
