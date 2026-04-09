import api from '../lib/api'

export const getNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params })
  return data
}

export const getUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count')
  return data
}

export const markAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`)
  return response.data
}

export const markAllAsRead = async () => {
  const response = await api.put('/notifications/read-all')
  return response.data
}

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`)
  return response.data
}
