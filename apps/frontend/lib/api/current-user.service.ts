import { httpClient } from "./http-client";
import type { CurrentUser } from "@/lib/current-user.shared";

type CurrentUserResponse = {
  status: "success";
  data: CurrentUser;
};

export async function getCurrentUserFromApi() {
  const { data } = await httpClient.get<CurrentUserResponse>("/me");

  return data.data;
}
