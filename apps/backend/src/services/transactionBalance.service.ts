import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';

export interface UserStatDeltas {
    totalInvested?: number;
    totalEarnings?: number;
}

const CREDIT_TYPES: TransactionType[] = [
    TransactionType.DEPOSIT,
    TransactionType.REFUND,
    TransactionType.BONUS,
    TransactionType.REFERRAL_BONUS,
    TransactionType.PAYOUT,
];

const DEBIT_TYPES: TransactionType[] = [
    TransactionType.WITHDRAWAL,
    TransactionType.FEE,
    TransactionType.INVESTMENT,
];

type PrismaTx = Omit<
    Prisma.TransactionClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export function getBalanceDelta(
    type: TransactionType,
    amount: number,
    status: TransactionStatus
): number {
    if (status !== TransactionStatus.COMPLETED) {
        return 0;
    }

    const absAmount = Math.abs(Number(amount));

    if (CREDIT_TYPES.includes(type)) {
        return absAmount;
    }

    if (DEBIT_TYPES.includes(type)) {
        return -absAmount;
    }

    return 0;
}

export function getUserStatDeltas(
    type: TransactionType,
    amount: number,
    status: TransactionStatus
): UserStatDeltas {
    if (status !== TransactionStatus.COMPLETED) {
        return {};
    }

    const absAmount = Math.abs(Number(amount));

    if (type === TransactionType.INVESTMENT) {
        return { totalInvested: absAmount };
    }

    if (type === TransactionType.PAYOUT) {
        return { totalEarnings: absAmount };
    }

    return {};
}

export function computeNetAmount(type: TransactionType, amount: number): number {
    const absAmount = Math.abs(Number(amount));

    if (type === TransactionType.WITHDRAWAL || type === TransactionType.FEE) {
        return -absAmount;
    }

    return absAmount;
}

async function applyUserDeltas(
    prisma: PrismaTx,
    userId: string,
    balanceDelta: number,
    statDeltas: UserStatDeltas
): Promise<void> {
    if (
        balanceDelta === 0 &&
        !statDeltas.totalInvested &&
        !statDeltas.totalEarnings
    ) {
        return;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    const newBalance = Number(user.balance) + balanceDelta;
    if (newBalance < 0) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (balanceDelta !== 0) {
        updateData.balance = { increment: balanceDelta };
    }

    if (statDeltas.totalInvested) {
        updateData.totalInvested = { increment: statDeltas.totalInvested };
    }

    if (statDeltas.totalEarnings) {
        updateData.totalEarnings = { increment: statDeltas.totalEarnings };
    }

    await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });
}

export async function applyTransactionEffects(
    prisma: PrismaTx,
    userId: string,
    type: TransactionType,
    amount: number,
    status: TransactionStatus
): Promise<void> {
    const balanceDelta = getBalanceDelta(type, amount, status);
    const statDeltas = getUserStatDeltas(type, amount, status);

    await applyUserDeltas(prisma, userId, balanceDelta, statDeltas);
}

export async function reverseTransactionEffects(
    prisma: PrismaTx,
    userId: string,
    type: TransactionType,
    amount: number,
    status: TransactionStatus
): Promise<void> {
    const balanceDelta = getBalanceDelta(type, amount, status);
    const statDeltas = getUserStatDeltas(type, amount, status);

    const reversedStats: UserStatDeltas = {};
    if (statDeltas.totalInvested) {
        reversedStats.totalInvested = -statDeltas.totalInvested;
    }
    if (statDeltas.totalEarnings) {
        reversedStats.totalEarnings = -statDeltas.totalEarnings;
    }

    await applyUserDeltas(prisma, userId, -balanceDelta, reversedStats);
}

export async function reconcileTransactionEffects(
    prisma: PrismaTx,
    oldUserId: string,
    newUserId: string,
    oldType: TransactionType,
    oldAmount: number,
    oldStatus: TransactionStatus,
    newType: TransactionType,
    newAmount: number,
    newStatus: TransactionStatus
): Promise<void> {
    if (oldUserId === newUserId) {
        const oldBalanceDelta = getBalanceDelta(oldType, oldAmount, oldStatus);
        const newBalanceDelta = getBalanceDelta(newType, newAmount, newStatus);
        const netBalanceDelta = newBalanceDelta - oldBalanceDelta;

        const oldStats = getUserStatDeltas(oldType, oldAmount, oldStatus);
        const newStats = getUserStatDeltas(newType, newAmount, newStatus);

        const netStats: UserStatDeltas = {};
        const investedDelta =
            (newStats.totalInvested || 0) - (oldStats.totalInvested || 0);
        const earningsDelta =
            (newStats.totalEarnings || 0) - (oldStats.totalEarnings || 0);

        if (investedDelta !== 0) {
            netStats.totalInvested = investedDelta;
        }
        if (earningsDelta !== 0) {
            netStats.totalEarnings = earningsDelta;
        }

        await applyUserDeltas(prisma, newUserId, netBalanceDelta, netStats);
        return;
    }

    await reverseTransactionEffects(
        prisma,
        oldUserId,
        oldType,
        oldAmount,
        oldStatus
    );
    await applyTransactionEffects(
        prisma,
        newUserId,
        newType,
        newAmount,
        newStatus
    );
}
