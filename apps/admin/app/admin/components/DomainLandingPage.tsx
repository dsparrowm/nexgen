'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, LucideIcon } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

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

const statusVariants: Record<DomainCard['status'], BadgeVariant> = {
    live: 'success',
    planned: 'neutral',
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
            <Card>
                <CardContent className="p-6">
                    <div className="inline-flex rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-800">
                        {eyebrow}
                    </div>
                    <h1 className="mt-4 text-2xl font-semibold text-zinc-900">{title}</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500">{description}</p>
                </CardContent>
            </Card>

            {callout && (
                <Card className="border-gold-200 bg-gold-50/50">
                    <CardContent className="p-6">
                        <h2 className="text-sm font-semibold text-zinc-900">{callout.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{callout.description}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {cards.map((card, index) => {
                    const content = (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: index * 0.04 }}
                            className="h-full"
                        >
                            <Card className={cn('h-full card-hover', card.href && 'cursor-pointer')}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-600">
                                            <card.icon className="h-5 w-5" />
                                        </div>
                                        <Badge variant={statusVariants[card.status]}>
                                            {statusLabels[card.status]}
                                        </Badge>
                                    </div>

                                    <h2 className="mt-5 text-lg font-semibold text-zinc-900">{card.title}</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">{card.description}</p>

                                    {card.note && (
                                        <p className="mt-4 text-xs uppercase tracking-wider text-zinc-400">{card.note}</p>
                                    )}

                                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-700">
                                        {card.href ? 'Open tool' : 'Coming soon'}
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
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
        </div>
    )
}

export default DomainLandingPage
