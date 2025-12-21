import { client } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";
import { PendingRequest } from "../../api/types";

interface IncomingResponse {
  incoming_requests: PendingRequest[];
}

interface OutgoingResponse {
  outgoing_requests: PendingRequest[];
}

export async function getIncomingFriendRequests(): Promise<PendingRequest[]> {
  const response = await client.get<IncomingResponse>(ENDPOINTS.FRIENDS.INCOMING);
  console.log(response.data);
  return response.data.incoming_requests;
}

export async function getOutgoingFriendRequesets(): Promise<PendingRequest[]> {
  const response = await client.get<OutgoingResponse>(ENDPOINTS.FRIENDS.OUTGOING);
  console.log(response.data);
  if (!response.data) {
    console.log("couldn't get outgoing");
  }
  return response.data.outgoing_requests;
}

export async function acceptFriendRequest(target_id: string): Promise<void> {
  await client.post(
    ENDPOINTS.FRIENDS.ACCEPT,
    {
      target_id: target_id,
    }
  );
}

export async function rejectFriendRequest(target_id: string): Promise<void> {
  await client.post(
    ENDPOINTS.FRIENDS.REJECT,
    {
      target_id: target_id,
    }
  )
}