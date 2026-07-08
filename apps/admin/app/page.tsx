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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-gold-500" />
          <p className="text-sm text-zinc-500">Loading admin portal...</p>
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