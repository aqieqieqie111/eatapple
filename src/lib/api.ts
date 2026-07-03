// Client-side API helpers

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  members: { user: Pick<User, "id" | "name" | "avatar"> }[];
}

export interface MemberStatus {
  userId: string;
  userName: string;
  userAvatar: string | null;
  status: "checked" | "waiting" | "missed";
  checkIn: {
    id: string;
    photoData: string;
    note: string | null;
    checkedAt: string;
  } | null;
}

export interface TodayData {
  date: string;
  isOverdue: boolean;
  checkedCount: number;
  totalCount: number;
  members: MemberStatus[];
}

export interface UserStat {
  userId: string;
  userName: string;
  userAvatar: string | null;
  last7Days: number;
  last30Days: number;
  streak: number;
}

export interface StatsData {
  todayRate: number;
  totalMembers: number;
  todayChecked: number;
  userStats: UserStat[];
}

async function request(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

// Auth
export async function register(name: string, email: string, password: string) {
  return request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email: string, password: string) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user: User | null }> {
  try {
    return await request("/api/auth/me");
  } catch {
    return { user: null };
  }
}

// Teams
export async function createTeam(name: string) {
  return request("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function getTeams(): Promise<{ teams: Team[] }> {
  return request("/api/teams");
}

export async function joinTeam(inviteCode: string) {
  return request("/api/teams/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });
}

// Check-in
export async function submitCheckIn(teamId: string, photoData: string, note?: string) {
  return request("/api/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId, photoData, note }),
  });
}

export async function getTodayCheckIn(teamId: string): Promise<TodayData> {
  return request(`/api/checkin/today?teamId=${teamId}`);
}

export async function getHistoryCheckIn(
  teamId: string,
  date: string
): Promise<{ date: string; members: MemberStatus[] }> {
  return request(`/api/checkin/history?teamId=${teamId}&date=${date}`);
}

export async function getStats(teamId: string): Promise<StatsData> {
  return request(`/api/checkin/stats?teamId=${teamId}`);
}
