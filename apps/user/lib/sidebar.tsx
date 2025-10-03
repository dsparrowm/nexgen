"use client"

import React from 'react'
import { cn } from "../lib/utils"

interface DashboardSidebarProps {
    className?: string
    children: React.ReactNode
}

export function DashboardSidebar({ className, children }: DashboardSidebarProps) {
    return (
        <div className={cn("flex h-full w-64 flex-col bg-dark-800/50 backdrop-blur-sm border-r border-gold-500/20", className)}>
            {children}
        </div>
    )
}

interface SidebarHeaderProps {
    className?: string
    children: React.ReactNode
}

export function SidebarHeader({ className, children }: SidebarHeaderProps) {
    return (
        <div className={cn("flex items-center px-6 py-4 border-b border-gold-500/20", className)}>
            {children}
        </div>
    )
}

interface SidebarContentProps {
    className?: string
    children: React.ReactNode
}

export function SidebarContent({ className, children }: SidebarContentProps) {
    return (
        <div className={cn("flex-1 overflow-auto py-4", className)}>
            {children}
        </div>
    )
}

interface SidebarMenuProps {
    className?: string
    children: React.ReactNode
}

export function SidebarMenu({ className, children }: SidebarMenuProps) {
    return (
        <nav className={cn("space-y-1 px-3", className)}>
            {children}
        </nav>
    )
}

interface SidebarMenuItemProps {
    className?: string
    children: React.ReactNode
    href?: string
    isActive?: boolean
    onClick?: () => void
}

export function SidebarMenuItem({ className, children, href, isActive, onClick }: SidebarMenuItemProps) {
    const baseClasses = "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
    const activeClasses = isActive
        ? "bg-gold-500/20 text-gold-500 border-l-2 border-gold-500"
        : "text-gray-300 hover:bg-navy-700/50 hover:text-white"

    if (href) {
        return (
            <a href={href} className={cn(baseClasses, activeClasses, className)}>
                {children}
            </a>
        )
    }

    return (
        <button onClick={onClick} className={cn(baseClasses, activeClasses, className)}>
            {children}
        </button>
    )
}