"use client"

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Login from '../components/Login'
import Dashboard from '../components/Dashboard'

const AdminPage = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-navy-900 to-dark-800 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />
  }

  // Show dashboard if authenticated
  return <Dashboard />
}

export default AdminPage