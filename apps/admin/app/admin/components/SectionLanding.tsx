'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, LucideIcon } from 'lucide-react'

type SectionCardStatus = 'Live' | 'Needs Backend' | 'Planned'

interface SectionCard {
    title: string
    description: string
    href?: string
    status: SectionCardStatus
    icon: LucideIcon
    badge?: {
        label: string
        count?: number
    }
}

interface SectionLandingProps {
    eyebrow: string
    title: string
    description: string
    notes?: string[]
    cards: SectionCard[]
}

const statusClasses: Record<SectionCardStatus, string> = {
    Live: 'border-green-500/20 bg-green-500/10 text-green-300',
    'Needs Backend': 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300',
    Planned: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
}

const SectionLanding: React.FC<SectionLandingProps> = ({ eyebrow, title, description, notes = [], cards }) => {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
            >
                <div className="inline-flex rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                    {eyebrow}
                </div>
                <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">{description}</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {cards.map((card, index) => {
                    const content = (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="h-full rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm transition-colors hover:border-gold-500/30 hover:bg-dark-800/70"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-semibold text-white">{card.title}</h2>
                                            {card.badge ? (
                                                <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-100 shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_0_18px_rgba(239,68,68,0.18)]">
                                                    {card.badge.label}
                                                    {typeof card.badge.count === 'number' ? ` ${card.badge.count > 99 ? '99+' : card.badge.count}` : ''}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-gray-300">{card.description}</p>
                                    </div>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[card.status]}`}>
                                    {card.status}
                                </span>
                            </div>

                            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-300">
                                {card.href ? 'Open workspace' : 'Design target'}
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </motion.div>
                    )

                    if (!card.href) {
                        return <div key={card.title}>{content}</div>
                    }

                    return (
                        <Link key={card.title} href={card.href} className="block h-full">
                            {content}
                        </Link>
                    )
                })}
            </div>

            {notes.length > 0 && (
                <div className="rounded-3xl border border-gold-500/20 bg-navy-900/40 p-6">
                    <h2 className="text-lg font-semibold text-white">Engineering Notes</h2>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-gray-300">
                        {notes.map((note) => (
                            <p key={note}>{note}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SectionLanding
