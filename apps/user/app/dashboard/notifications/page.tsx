import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import AuthGuard from '@/components/auth/AuthGuard'

export default function NotificationsPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="notifications">
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gold-500/20 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Notifications</h2>
                    <p className="text-gray-400">
                        Notifications feature coming soon. You'll be able to view all your system notifications here.
                    </p>
                </div>
            </DashboardLayout>
        </AuthGuard>
    )
}
