import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import useAuthStore from '../store/authStore'

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  withCredentials: true,
  autoConnect: false
})

export function useSocket() {
  const { user } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      if (socket.connected) socket.disconnect()
      return
    }

    socket.connect()

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id)
      setIsConnected(true)
      socket.emit('authenticate', user.uuid)
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
      setIsConnected(false)
    })

    socket.on('notification', (notification) => {
      console.log('📩 New notification:', notification)
      setNotifications(prev => [notification, ...prev])
    })

    socket.on('notification_marked', ({ notificationId }) => {
      setNotifications(prev =>
        prev.map(n => n.uuid === notificationId ? { ...n, isRead: true } : n)
      )
    })

    socket.on('notifications_read_all', () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('notification')
      socket.off('notification_marked')
      socket.off('notifications_read_all')
    }
  }, [user])

  return { socket, isConnected, notifications, setNotifications }
}

export default socket
