import Link from 'next/link'
import { ArrowLeft, BookOpen, ShieldCheck, LifeBuoy, MessageCircleQuestion } from 'lucide-react'

const GUIDES = [
    {
        title: 'Getting Started',
        description: 'How to create your account, verify your email, and complete your profile.',
    },
    {
        title: 'Deposits & Withdrawals',
        description: 'Where to find wallet details, deposit status, and withdrawal timelines.',
    },
    {
        title: 'Security Tips',
        description: 'Best practices for keeping your account secure and recognizing suspicious activity.',
    },
    {
        title: 'Account Recovery',
        description: 'Steps to reset your password and recover access if you lose your login details.',
    },
]

const FAQs = [
    {
        question: 'How do I verify my account?',
        answer: 'After signing up, check your inbox for the verification email and follow the link or code inside it.',
    },
    {
        question: 'How do I contact support?',
        answer: 'Use live chat from the dashboard or email support@nexgencrypto.live for help from the team.',
    },
    {
        question: 'Where can I check withdrawal status?',
        answer: 'Open the Withdrawals area inside your dashboard to review processing updates and history.',
    },
]

export default function SupportDocsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-navy-950 via-dark-900 to-navy-950 text-white">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <Link
                    href="/dashboard/support"
                    className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Support Center
                </Link>

                <section className="mt-6 rounded-3xl border border-gold-500/20 bg-white/5 p-8 backdrop-blur-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-sm text-gold-300">
                                <BookOpen className="h-4 w-4" />
                                Support Guides
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">FAQ and full help guides</h1>
                            <p className="mt-4 text-gray-300">
                                Use this page for quick answers and longer walkthroughs on common account tasks.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 text-sm text-gray-200">
                            <div className="font-semibold text-white">Need more help?</div>
                            <div className="mt-1">Chat with support or send us an email anytime.</div>
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-gold-500/15 bg-dark-800/60 p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-green-500/15 p-3">
                                <LifeBuoy className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Help Guides</h2>
                                <p className="text-sm text-gray-400">Short walkthroughs for common tasks</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {GUIDES.map((guide) => (
                                <div key={guide.title} className="rounded-xl border border-white/5 bg-white/5 p-4">
                                    <h3 className="font-medium text-white">{guide.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-gray-300">{guide.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gold-500/15 bg-dark-800/60 p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-purple-500/15 p-3">
                                <MessageCircleQuestion className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Quick FAQ</h2>
                                <p className="text-sm text-gray-400">Common questions with fast answers</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {FAQs.map((faq) => (
                                <div key={faq.question} className="rounded-xl border border-white/5 bg-white/5 p-4">
                                    <h3 className="font-medium text-white">{faq.question}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-gray-300">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-8 rounded-2xl border border-gold-500/15 bg-dark-800/60 p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/15 p-3">
                            <ShieldCheck className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Still stuck?</h2>
                            <p className="text-sm text-gray-400">Reach out to the support team and we’ll take it from there.</p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                            href="/dashboard/support"
                            className="inline-flex items-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:bg-gold-600"
                        >
                            Open Support Center
                        </Link>
                        <a
                            href="mailto:support@nexgencrypto.live"
                            className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
                        >
                            Email Support
                        </a>
                    </div>
                </section>
            </div>
        </main>
    )
}
