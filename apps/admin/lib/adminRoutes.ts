export const adminRoutes = {
    operations: '/admin',
    customers: '/admin/customers',
    customersAdd: '/admin/customers/add',
    customerDetails: (userId: string) => `/admin/customers/${userId}`,
    customerEdit: (userId: string) => `/admin/customers/${userId}/edit`,
    treasury: '/admin/treasury',
    treasuryLedger: '/admin/treasury/ledger',
    treasuryCredits: '/admin/treasury/credits',
    treasuryCreditsAdd: '/admin/treasury/credits/add',
    treasuryPayouts: '/admin/treasury/payouts',
    transactions: '/admin/transactions',
    assets: '/admin/assets',
    miningDesk: '/admin/mining',
    complianceKyc: '/admin/compliance/kyc',
    communications: '/admin/communications',
    communicationsSupport: '/admin/communications/support',
    communicationsNotifications: '/admin/communications/notifications',
    communicationsGovernance: '/admin/communications/governance',
    growth: '/admin/growth',
    growthReferrals: '/admin/growth/referrals',
    growthPromotions: '/admin/growth/promotions',
    analytics: '/admin/analytics',
    platform: '/admin/platform',
    platformSettings: '/admin/platform/settings',
    platformSecurity: '/admin/platform/security',
}

export interface AdminRouteMeta {
    title: string
    description: string
}

const prefixRouteMetaEntries: Array<{ match: string; meta: AdminRouteMeta }> = [
    {
        match: adminRoutes.operations,
        meta: {
            title: 'Operations Center',
            description: 'Monitor the platform, clear queues, and jump into high-priority workflows.',
        },
    },
    {
        match: adminRoutes.customers,
        meta: {
            title: 'Customers',
            description: 'Manage customer accounts, identity state, and account access.',
        },
    },
    {
        match: adminRoutes.treasury,
        meta: {
            title: 'Treasury',
            description: 'Control balances, approvals, payouts, and the financial ledger.',
        },
    },
    {
        match: adminRoutes.transactions,
        meta: {
            title: 'Treasury Ledger',
            description: 'Approve deposits, withdrawals, refunds, and fee adjustments.',
        },
    },
    {
        match: adminRoutes.assets,
        meta: {
            title: 'Assets Desk',
            description: 'Oversee asset positions, pricing, and portfolio operations.',
        },
    },
    {
        match: adminRoutes.miningDesk,
        meta: {
            title: 'Mining Desk',
            description: 'Control mining plans, capacity, and investor exposure.',
        },
    },
    {
        match: '/admin/compliance',
        meta: {
            title: 'Compliance',
            description: 'Review KYC, risk queues, and customer verification workflows.',
        },
    },
    {
        match: adminRoutes.communications,
        meta: {
            title: 'Communications',
            description: 'Coordinate support, notifications, and customer messaging.',
        },
    },
    {
        match: adminRoutes.growthPromotions,
        meta: {
            title: 'Growth Controls',
            description: 'Manage promotion rules, bonus policies, and referral incentives.',
        },
    },
    {
        match: adminRoutes.growth,
        meta: {
            title: 'Growth',
            description: 'Manage referrals, incentive programs, and lifecycle growth levers.',
        },
    },
    {
        match: adminRoutes.analytics,
        meta: {
            title: 'Analytics',
            description: 'Track platform performance, liabilities, and operational trends.',
        },
    },
    {
        match: adminRoutes.platform,
        meta: {
            title: 'Platform',
            description: 'Configure system settings, security, permissions, and platform controls.',
        },
    },
]

const defaultAdminRouteMeta: AdminRouteMeta = {
    title: 'Operations Center',
    description: 'Monitor the platform, clear queues, and jump into high-priority workflows.',
}

export const getAdminRouteMeta = (pathname: string | null | undefined): AdminRouteMeta => {
    if (!pathname) {
        return defaultAdminRouteMeta
    }

    if (pathname.startsWith('/admin/customers/') && pathname.endsWith('/edit')) {
        return prefixRouteMetaEntries.find((entry) => entry.match === adminRoutes.customers)?.meta || defaultAdminRouteMeta
    }

    for (const entry of [...prefixRouteMetaEntries].sort((left, right) => right.match.length - left.match.length)) {
        if (entry.match === adminRoutes.operations) {
            continue
        }

        if (pathname.startsWith(entry.match)) {
            return entry.meta
        }
    }

    return defaultAdminRouteMeta
}
