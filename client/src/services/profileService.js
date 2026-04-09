import api from '../lib/api'

export const getProfile = async () => {
  const { data } = await api.get('/profile')
  return data
}

export const updateProfile = async (data) => {
  const response = await api.put('/profile', data)
  return response.data
}

export const deleteAccount = async () => {
  const response = await api.delete('/profile')
  return response.data
}

export const getSessions = async () => {
  const { data } = await api.get('/sessions')
  return data
}

export const terminateSession = async (id) => {
  const response = await api.delete(`/sessions/${id}`)
  return response.data
}

export const terminateAllSessions = async () => {
  const response = await api.delete('/sessions')
  return response.data
}
