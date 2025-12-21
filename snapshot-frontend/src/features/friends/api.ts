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
  );
}

export async function cancelFriendRequest(target_id: string): Promise<void> {
  await client.post(
    ENDPOINTS.FRIENDS.CANCEL,
    {
      target_id: target_id,
    }
  );
}

export interface Friend {
  id: string;
  name: string;
  picture: string;
}

interface FriendsResponse {
  friends: Friend[];
}

export async function getFriends(): Promise<Friend[]> {
  const response = await client.get<FriendsResponse>(ENDPOINTS.FRIENDS.LIST);
  return response.data.friends;
}

export async function sendFriendRequest(targetEmail: string): Promise<void> {
  await client.post(
    ENDPOINTS.FRIENDS.REQUEST,
    {
      target_email: targetEmail,
    }
  );
}

export async function removeFriend(targetId: string): Promise<void> {
  await client.delete(
    ENDPOINTS.FRIENDS.REMOVE,
    {
      data: {
        target_id: targetId
      }
    }
  );
}