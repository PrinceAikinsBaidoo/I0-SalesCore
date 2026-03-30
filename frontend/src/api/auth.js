import client from './client'

export const authApi = {
  login: (credentials) => client.post('/auth/login', credentials),
  me: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout'),
}
