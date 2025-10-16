"use client"

import React, { useState } from 'react'

type FaqItem = {
    question: string
    answer: string
}

const SAMPLE_FAQS: FaqItem[] = [
    {
        question: 'How do I verify my account?',
        answer:
            'After signing up you will receive a verification code by email. Enter that code on the verification page or click the verification link to activate your account.',
    },
    {
        question: 'How do I reset my password?',
        answer:
            'Go to the Reset Password page, enter your registered email, and follow the instructions we send you. If you don\'t receive an email, check your spam folder.',
    },
    {
        question: 'How long does a withdrawal take?',
        answer:
            'Withdrawals are processed within 1-3 business days depending on network congestion and your bank or payment provider.',
    },
    {
        question: 'Where can I see my investment history?',
        answer:
            'Open the Investments section in your dashboard to view past investments, performance, and transaction history.',
    },
]

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="space-y-3">
            <div className="text-gray-300 text-sm">Top questions</div>
            <div className="space-y-2">
                {SAMPLE_FAQS.map((f, idx) => {
                    const isOpen = openIndex === idx
                    return (
                        <div
                            key={f.question}
                            className="bg-dark-800/40 rounded-xl p-3 border border-gold-500/10"
                        >
                            <button
                                aria-expanded={isOpen}
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <span className="text-white font-medium">{f.question}</span>
                                <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
                            </button>

                            {isOpen && (
                                <div className="mt-3 text-gray-300 text-sm leading-relaxed">
                                    {f.answer}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="pt-2">
                <a
                    href="/docs/support"
                    className="inline-block px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
                >
                    View full guides
                </a>
            </div>
        </div>
    )
}
