/**
 * Logout utility functions for handling user authentication
 */

export const logout = async () => {
    try {
        // Clear any stored authentication tokens
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')

        // Clear session storage
        sessionStorage.clear()

        // Clear any cookies related to authentication
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // If you're using an API endpoint for logout, uncomment and modify this:
        // await fetch('/api/auth/logout', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        // })

        // Redirect to login page or home page
        window.location.href = '/'

    } catch (error) {
        console.error('Logout error:', error)
        // Even if there's an error, redirect to ensure user is logged out from UI perspective
        window.location.href = '/'
    }
}

export const confirmLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (confirmed) {
        logout()
    }
    return confirmed
}