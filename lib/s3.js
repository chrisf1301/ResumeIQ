import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Upload file to S3
export async function uploadToS3(fileBuffer, fileName, mimeType) {
    const key = `resumes/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType
    });

    await s3Client.send(command);
    
    return {
        key,
        bucket: BUCKET_NAME,
        url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
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

export { s3Client, BUCKET_NAME };
