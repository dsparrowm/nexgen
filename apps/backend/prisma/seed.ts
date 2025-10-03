import { PrismaClient, UserRole, KycStatus, OperationStatus, RiskLevel, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Using crypto.randomUUID() instead of nanoid for CommonJS compatibility
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create system configuration
    const systemConfigs = [
        {
            key: 'MIN_WITHDRAWAL_AMOUNT',
            value: '50.00',
            description: 'Minimum withdrawal amount in USD'
        },
        {
            key: 'MAX_WITHDRAWAL_AMOUNT',
            value: '10000.00',
            description: 'Maximum withdrawal amount per transaction in USD'
        },
        {
            key: 'WITHDRAWAL_FEE_PERCENTAGE',
            value: '2.5',
            description: 'Withdrawal fee percentage'
        },
        {
            key: 'REFERRAL_BONUS_PERCENTAGE',
            value: '5.0',
            description: 'Referral bonus percentage for new user investments'
        },
        {
            key: 'PLATFORM_MAINTENANCE',
            value: 'false',
            description: 'Platform maintenance mode flag'
        },
        {
            key: 'KYC_REQUIRED_FOR_WITHDRAWAL',
            value: 'true',
            description: 'Require KYC verification for withdrawals'
        }
    ];

    for (const config of systemConfigs) {
        await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: config,
            create: config,
        });
    }

    console.log('✅ System configuration seeded');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@nexgen.com' },
        update: {},
        create: {
            email: 'admin@nexgen.com',
            username: 'admin',
            firstName: 'System',
            lastName: 'Administrator',
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            isVerified: true,
            kycStatus: KycStatus.APPROVED,
            referralCode: randomUUID().substring(0, 8).toUpperCase(),
            balance: 0,
            totalInvested: 0,
            totalEarnings: 0,
        },
    });

    console.log('✅ Admin user created');

    // Create demo user
    const demoPassword = await bcrypt.hash('demo123', 12);
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@nexgen.com' },
        update: {},
        create: {
            email: 'demo@nexgen.com',
            username: 'demo_user',
            firstName: 'Demo',
            lastName: 'User',
            password: demoPassword,
            role: UserRole.USER,
            isActive: true,
            isVerified: true,
            kycStatus: KycStatus.APPROVED,
            referralCode: randomUUID().substring(0, 8).toUpperCase(),
            balance: 1000,
            totalInvested: 0,
            totalEarnings: 0,
            phoneNumber: '+1234567890',
            country: 'United States',
            state: 'California',
            city: 'San Francisco',
        },
    });

    console.log('✅ Demo user created');

    // Create mining operations
    const miningOperations = [
        {
            name: 'Bitcoin Mining Pool Alpha',
            description: 'High-performance Bitcoin mining operation with state-of-the-art ASIC miners.',
            minInvestment: 100,
            maxInvestment: 10000,
            dailyReturn: 0.015, // 1.5% daily
            duration: 30,
            riskLevel: RiskLevel.LOW,
            status: OperationStatus.ACTIVE,
            totalCapacity: 1000000,
            currentCapacity: 250000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            imageUrl: '/mining-images/bitcoin-alpha.jpg',
            features: [
                'SHA-256 Algorithm',
                'Antminer S19 Pro',
                '24/7 Monitoring',
                'Daily Payouts',
                'Low Risk'
            ]
        },
        {
            name: 'Ethereum Mining Rig Beta',
            description: 'Ethereum mining with GPU rigs optimized for maximum efficiency.',
            minInvestment: 250,
            maxInvestment: 25000,
            dailyReturn: 0.020, // 2.0% daily
            duration: 45,
            riskLevel: RiskLevel.MEDIUM,
            status: OperationStatus.ACTIVE,
            totalCapacity: 750000,
            currentCapacity: 180000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            imageUrl: '/mining-images/ethereum-beta.jpg',
            features: [
                'Ethash Algorithm',
                'RTX 3080 Ti GPUs',
                'Optimized Cooling',
                'High Efficiency',
                'Medium Risk'
            ]
        },
        {
            name: 'Altcoin Mining Gamma',
            description: 'Diversified altcoin mining for high-return potential investments.',
            minInvestment: 500,
            maxInvestment: 50000,
            dailyReturn: 0.025, // 2.5% daily
            duration: 60,
            riskLevel: RiskLevel.HIGH,
            status: OperationStatus.ACTIVE,
            totalCapacity: 500000,
            currentCapacity: 125000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            imageUrl: '/mining-images/altcoin-gamma.jpg',
            features: [
                'Multi-Algorithm',
                'Custom Mining Rigs',
                'Advanced Analytics',
                'High Returns',
                'High Risk'
            ]
        },
        {
            name: 'Green Mining Delta',
            description: 'Eco-friendly mining operation powered by renewable energy sources.',
            minInvestment: 200,
            maxInvestment: 15000,
            dailyReturn: 0.012, // 1.2% daily
            duration: 90,
            riskLevel: RiskLevel.LOW,
            status: OperationStatus.ACTIVE,
            totalCapacity: 300000,
            currentCapacity: 75000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            imageUrl: '/mining-images/green-delta.jpg',
            features: [
                'Solar Powered',
                'Carbon Neutral',
                'Sustainable Mining',
                'Extended Duration',
                'Eco-Friendly'
            ]
        }
    ];

    for (const operation of miningOperations) {
        await prisma.miningOperation.create({
            data: operation,
        });
    }

    console.log('✅ Mining operations seeded');

    // Create sample investment for demo user
    const btcOperation = await prisma.miningOperation.findFirst({
        where: { name: 'Bitcoin Mining Pool Alpha' }
    });

    if (btcOperation) {
        const investment = await prisma.investment.create({
            data: {
                userId: demoUser.id,
                miningOperationId: btcOperation.id,
                amount: 500,
                dailyReturn: btcOperation.dailyReturn,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
        });

        // Create some sample payouts
        const payoutDates = [
            new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        ];

        for (const date of payoutDates) {
            const payoutAmount = 500 * 0.015; // 1.5% of investment
            await prisma.payout.create({
                data: {
                    investmentId: investment.id,
                    amount: payoutAmount,
                    date: date,
                    description: `Daily mining payout for ${date.toDateString()}`,
                }
            });
        }

        // Update investment total earnings
        await prisma.investment.update({
            where: { id: investment.id },
            data: {
                totalEarnings: 500 * 0.015 * 5, // 5 days of payouts
                lastPayout: payoutDates[payoutDates.length - 1],
            }
        });

        // Update user's total earnings and balance
        await prisma.user.update({
            where: { id: demoUser.id },
            data: {
                totalInvested: 500,
                totalEarnings: 500 * 0.015 * 5,
                balance: 1000 + (500 * 0.015 * 5), // Initial balance + earnings
            }
        });

        console.log('✅ Sample investment and payouts created');
    }

    // Create sample notifications
    const notifications = [
        {
            userId: demoUser.id,
            type: NotificationType.INVESTMENT_CREATED,
            title: 'Investment Created',
            message: 'Your investment in Bitcoin Mining Pool Alpha has been successfully created.',
            metadata: { investmentAmount: 500, miningOperation: 'Bitcoin Mining Pool Alpha' }
        },
        {
            userId: demoUser.id,
            type: NotificationType.PAYOUT_RECEIVED,
            title: 'Daily Payout Received',
            message: 'You have received $7.50 from your Bitcoin mining investment.',
            metadata: { amount: 7.50, source: 'Bitcoin Mining Pool Alpha' }
        },
        {
            userId: demoUser.id,
            type: NotificationType.KYC_APPROVED,
            title: 'KYC Verification Approved',
            message: 'Your KYC verification has been approved. You can now make withdrawals.',
            metadata: { approvalDate: new Date().toISOString() }
        }
    ];

    for (const notification of notifications) {
        await prisma.notification.create({ data: notification });
    }

    console.log('✅ Sample notifications created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log('- System configurations: 6 items');
    console.log('- Admin user: admin@nexgen.com (password: admin123)');
    console.log('- Demo user: demo@nexgen.com (password: demo123)');
    console.log('- Mining operations: 4 items');
    console.log('- Sample investment with 5 payouts');
    console.log('- Sample notifications: 3 items');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });