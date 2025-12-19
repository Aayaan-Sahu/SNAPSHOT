import { client } from "../../api/client";
import { ENDPOINTS } from "../../api/endpoints";
import { Group } from "../../api/types";

type GroupsResponse = {
    groups: Group[];
}

export async function fetchUserGroups(): Promise<Group[]> {
    const response = await client.get<GroupsResponse>(ENDPOINTS.GROUPS.BASE);
    return response.data.groups;
}