import { client } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";
import { Group, Friend } from "../../api/types";

interface FetchGroupsResponse {
  groups: Group[];
}

interface CreateGroupResponse {
  group: Group;
}

export async function fetchUserGroups(): Promise<Group[]> {
  const response = await client.get<FetchGroupsResponse>(ENDPOINTS.GROUPS.BASE);
  return response.data.groups;
}

export async function createGroup(name: string, memberIds: string[]): Promise<Group> {
  const response = await client.post<CreateGroupResponse>(
    ENDPOINTS.GROUPS.BASE,
    {
      name: name,
      members: memberIds,
    }
  );
  return response.data.group;
}

export async function leaveGroup(groupId: string): Promise<void> {
  await client.post(
    ENDPOINTS.GROUPS.LEAVE,
    {
      group_id: groupId
    }
  );
}

export async function deleteGroup(groupId: string): Promise<void> {
  await client.delete(
    ENDPOINTS.GROUPS.BASE,
    {
      params: {
        group_id: groupId
      }
    }
  );
}

interface FetchGroupMembersResponse {
  members: Friend[];
}

export async function fetchGroupMembers(groupId: string): Promise<Friend[]> {
  const response = await client.get<FetchGroupMembersResponse>(
    ENDPOINTS.GROUPS.MEMBERS,
    {
      params: {
        group_id: groupId
      }
    }
  );
  return response.data.members;
}

interface FetchOwnerResponse {
  owner_id: string;
}

export async function fetchGroupOwner(groupId: string): Promise<string> {
  const response = await client.get<FetchOwnerResponse>(
    ENDPOINTS.GROUPS.OWNER,
    {
      params: {
        group_id: groupId,
      },
    },
  );
  return response.data.owner_id;
}