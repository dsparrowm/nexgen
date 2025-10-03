"use client"

import React, { useState, useEffect } from 'react'
import Login from '../components/Login'
import Dashboard from '../components/Dashboard'

interface User {
  email: string
  name: string
}

const AdminPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('nexgen-admin-user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('Error parsing saved user:', error)
          localStorage.removeItem('nexgen-admin-user')
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = (credentials: { email: string; password: string }) => {
    // In a real app, this would make an API call to authenticate
    // For demo purposes, we'll accept any valid email/password combination
    const mockUser: User = {
      email: credentials.email,
      name: 'Admin User'
    }

    setUser(mockUser)
    // Save to localStorage for persistence
    localStorage.setItem('nexgen-admin-user', JSON.stringify(mockUser))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('nexgen-admin-user')
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-navy-900 to-dark-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Show dashboard if authenticated
  return <Dashboard onLogout={handleLogout} />
}

export default AdminPage