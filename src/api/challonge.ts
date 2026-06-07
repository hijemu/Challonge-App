import axios from "axios";

export const API_BASE_URL = "https://api-test-cmxie.duckdns.org";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const getTournaments = async () => (await api.get("/tournaments")).data;
export const getTournament = async (id: string) =>
  (await api.get(`/tournaments/${id}`)).data;
export const getMatches = async (id: string) =>
  (await api.get(`/tournaments/${id}/matches`)).data;
export const getParticipants = async (id: string) =>
  (await api.get(`/tournaments/${id}/participants`)).data;
export const getStandings = async (id: string) =>
  (await api.get(`/tournaments/${id}/standings`)).data;

export const getChallongeStatus = async () =>
  (await api.get("/challonge/status")).data;
export const getChallongeConnectUrl = async () =>
  (await api.get("/challonge/connect")).data;
export const disconnectChallonge = async () =>
  (await api.delete("/challonge/disconnect")).data;
export const connectApiKeyForDev = async (api_key: string) =>
  (await api.post("/challonge/connect-api-key", { api_key })).data;
export const createTournament = async (payload: any) =>
  (await api.post("/tournaments", payload)).data;
export const addParticipant = async (tournamentId: string, payload: any) =>
  (await api.post(`/tournaments/${tournamentId}/participants`, payload)).data;
export const addParticipantsBulk = async (
  tournamentId: string,
  names: string[]
) =>
  (await api.post(`/tournaments/${tournamentId}/participants/bulk`, { names }))
    .data;
export const shuffleParticipants = async (tournamentId: string) =>
  (await api.post(`/tournaments/${tournamentId}/participants/shuffle`)).data;

export const startTournament = async (tournamentId: string) =>
  (await api.post(`/tournaments/${tournamentId}/start`)).data;
export const updateTournamentTieBreaks = (
  id: string,
  payload: {
    ranking: string;
    tie_breaks: string[];
  }
) => api.put(`/tournaments/${id}/tiebreaks`, payload);
