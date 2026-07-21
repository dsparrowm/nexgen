import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';

export type CloudinaryFolder = 'profiles' | 'kyc';

let configured = false;

function ensureConfigured(): void {
    if (configured) return;

    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
        throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }

    cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
        secure: true,
    });

    configured = true;
}

function getFolderPath(folder: CloudinaryFolder, userId: string): string {
    const base =
        folder === 'profiles'
            ? config.cloudinary.folderProfiles
            : config.cloudinary.folderKyc;

    return `${base}/${userId}`;
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadBuffer(
    buffer: Buffer,
    options: {
        folder: CloudinaryFolder;
        userId: string;
        filename?: string;
        resourceType?: 'image' | 'raw' | 'auto';
        transformation?: Record<string, unknown>[];
    }
): Promise<UploadApiResponse> {
    ensureConfigured();

    const folderPath = getFolderPath(options.folder, options.userId);

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderPath,
                resource_type: options.resourceType || 'auto',
                public_id: options.filename
                    ? options.filename.replace(/\.[^.]+$/, '')
                    : undefined,
                overwrite: options.folder === 'profiles',
                unique_filename: options.folder !== 'profiles',
                transformation: options.transformation,
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error || !result) {
                    logger.error('Cloudinary upload failed', { error, folder: folderPath });
                    reject(error || new Error('Cloudinary upload returned no result'));
                    return;
                }
                resolve(result);
            }
        );

        Readable.from(buffer).pipe(uploadStream);
    });
}

/**
 * Upload a profile image with square crop transformation
 */
export async function uploadProfileImage(
    buffer: Buffer,
    userId: string,
    filename?: string
): Promise<UploadApiResponse> {
    return uploadBuffer(buffer, {
        folder: 'profiles',
        userId,
        filename: filename || `avatar-${userId}`,
        resourceType: 'image',
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    });
}

/**
 * Upload a KYC document (image or PDF)
 */
export async function uploadKycFile(
    buffer: Buffer,
    userId: string,
    filename?: string,
    mimeType?: string
): Promise<UploadApiResponse> {
    const isPdf = mimeType === 'application/pdf';

    return uploadBuffer(buffer, {
        folder: 'kyc',
        userId,
        filename,
        resourceType: isPdf ? 'raw' : 'auto',
    });
}

/**
 * Delete a Cloudinary asset by public ID
 */
export async function deleteAsset(
    publicId: string,
    resourceType: 'image' | 'raw' | 'auto' = 'image'
): Promise<void> {
    ensureConfigured();

    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        logger.warn('Failed to delete Cloudinary asset', { publicId, error });
    }
}

/**
 * Extract public ID from a Cloudinary secure URL
 */
export function extractPublicId(url: string): string | null {
    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
        if (!match?.[1]) return null;
        return match[1].replace(/\.[^.]+$/, '');
    } catch {
        return null;
    }
}

export function isCloudinaryConfigured(): boolean {
    return Boolean(
        config.cloudinary.cloudName &&
        config.cloudinary.apiKey &&
        config.cloudinary.apiSecret
    );
}
