import { client } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";
import { UploadConfig } from "../../api/types";

export async function getUploadUrl(): Promise<UploadConfig> {
  const res = await client.get<UploadConfig>(ENDPOINTS.PHOTOS.UPLOAD_URL);
  console.log(res.data);
  return res.data;
}

export async function confirmUpload(key: string, slotTimestamp: string): Promise<void> {
  await client.post(
    ENDPOINTS.PHOTOS.BASE,
    {
      key: key,
      slot_timestamp: slotTimestamp
    }
  );
}

interface StatusConfig {
  has_posted: boolean;
}

export async function getUserStatus(): Promise<boolean> {
  const response = await client.get<StatusConfig>(ENDPOINTS.USER.STATUS);
  return response.data.has_posted;
}