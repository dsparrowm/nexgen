import { Metadata } from 'next'
import AdminLayout from '../../components/AdminLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AddCreditsForm from './components/AddCreditsForm'

export const metadata: Metadata = {
    title: 'Add Credits - Admin Dashboard',
    description: 'Add credits to user account'
}

export default function AddCreditsPage() {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <AddCreditsForm />
            </AdminLayout>
        </ProtectedRoute>
    )
}
