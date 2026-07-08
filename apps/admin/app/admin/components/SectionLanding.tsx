'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, LucideIcon } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

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

const statusVariants: Record<SectionCardStatus, BadgeVariant> = {
    Live: 'success',
    'Needs Backend': 'warning',
    Planned: 'neutral',
}

const SectionLanding: React.FC<SectionLandingProps> = ({ eyebrow, title, description, notes = [], cards }) => {
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {cards.map((card) => {
                    const content = (
                        <Card className={cn('h-full card-hover', card.href && 'cursor-pointer')}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-600">
                                            <card.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-lg font-semibold text-zinc-900">{card.title}</h2>
                                                {card.badge ? (
                                                    <Badge variant="error">
                                                        {card.badge.label}
                                                        {typeof card.badge.count === 'number'
                                                            ? ` ${card.badge.count > 99 ? '99+' : card.badge.count}`
                                                            : ''}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{card.description}</p>
                                        </div>
                                    </div>
                                    <Badge variant={statusVariants[card.status]}>{card.status}</Badge>
                                </div>

                                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-700">
                                    {card.href ? 'Open workspace' : 'Coming soon'}
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
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
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-sm font-semibold text-zinc-900">Engineering notes</h2>
                        <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-500">
                            {notes.map((note) => (
                                <p key={note}>{note}</p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default SectionLanding
