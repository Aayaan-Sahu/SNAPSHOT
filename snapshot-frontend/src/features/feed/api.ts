import { client } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";
import { Group } from "../../api/types";

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