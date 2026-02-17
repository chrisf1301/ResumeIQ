import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials are missing!');
}

if (!process.env.S3_BUCKET_NAME) {
    console.error('S3_BUCKET_NAME is missing!');
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : undefined
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Upload file to S3
export async function uploadToS3(fileBuffer, fileName, mimeType) {
    if (!BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME environment variable is not set');
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials are not set');
    }

    const key = `resumes/${Date.now()}-${fileName}`;
    const region = process.env.AWS_REGION || 'us-east-2';
    
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error('S3 Upload Error:', {
            message: error.message,
            code: error.code,
            region: region,
            bucket: BUCKET_NAME,
            hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
        });
        throw error;
    }
    
    return {
        key,
        bucket: BUCKET_NAME,
        url: `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
    };
}

// Get file from S3
export async function getFromS3(key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    const response = await s3Client.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// Delete file from S3
export async function deleteFromS3(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    await s3Client.send(command);
}

// Generate presigned URL for direct upload
export async function getPresignedUploadUrl(fileName, mimeType) {
    const key = `resumes/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: mimeType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    
    return {
        url,
        key,
        bucket: BUCKET_NAME,
        s3Url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    };
}

export { s3Client, BUCKET_NAME };
