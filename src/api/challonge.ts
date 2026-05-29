import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

export const getTournaments = async () => {
  const response = await api.get('/tournaments');

  console.log(response.data);

  return response.data;
};