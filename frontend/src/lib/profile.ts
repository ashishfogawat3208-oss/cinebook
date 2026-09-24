import api from "@/lib/api";

import type { UserProfile } from "@/lib/types";

export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>("/auth/profile/");
  return response.data;
}

export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
  email: string;
}

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>(
    "/auth/profile/update/",
    payload
  );

  return response.data;
}