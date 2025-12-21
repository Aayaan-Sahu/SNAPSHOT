import * as ImageManipulator from "expo-image-manipulator";

export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function uploadToS3(signedUrl: string, localUri: string): Promise<void> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const upload = await fetch(signedUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });

  if (!upload.ok) {
    console.log("failed to upload to s3");
    throw new Error(`S3 Upload Failed: ${upload.statusText}`);
  }
}