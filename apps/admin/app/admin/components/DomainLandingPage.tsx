'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, LucideIcon } from 'lucide-react'

interface DomainCard {
    title: string
    description: string
    href?: string
    status: 'live' | 'planned'
    icon: LucideIcon
    note?: string
}

interface DomainLandingPageProps {
    eyebrow: string
    title: string
    description: string
    cards: DomainCard[]
    callout?: {
        title: string
        description: string
    }
}

const statusStyles: Record<DomainCard['status'], string> = {
    live: 'border-green-500/30 bg-green-500/10 text-green-300',
    planned: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
}

const statusLabels: Record<DomainCard['status'], string> = {
    live: 'Live now',
    planned: 'Planned',
}

const DomainLandingPage: React.FC<DomainLandingPageProps> = ({
    eyebrow,
    title,
    description,
    cards,
    callout,
}) => {
    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/60 p-6 backdrop-blur-sm">
                <div className="inline-flex rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
                    {eyebrow}
                </div>
                <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">{description}</p>
            </div>

            {callout && (
                <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-5">
                    <h2 className="text-lg font-semibold text-white">{callout.title}</h2>
                    <p className="mt-2 text-sm text-gray-300">{callout.description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {cards.map((card, index) => {
                    const content = (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: index * 0.04 }}
                            className="h-full rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm transition-colors hover:border-gold-400/30"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[card.status]}`}>
                                    {statusLabels[card.status]}
                                </span>
                            </div>

                            <h2 className="mt-5 text-xl font-semibold text-white">{card.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-gray-300">{card.description}</p>

                            {card.note && (
                                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-gray-500">{card.note}</p>
                            )}

                            {card.href && (
                                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-300">
                                    Open tool
                                    <ArrowUpRight className="h-4 w-4" />
                                </div>
                            )}
                        </motion.div>
                    )

                    if (!card.href) {
                        return <div key={card.title}>{content}</div>
                    }

                    return (
                        <Link key={card.title} href={card.href} className="block">
                            {content}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default DomainLandingPage
