import axios from './axios';

// Auth
export const login = (payload) => axios.post('/auth/login', payload);
export const register = (payload) => axios.post('/auth/register', payload);
export const logout = () => axios.post('/auth/logout');
export const refresh = () => axios.post('/auth/refresh');
export const me = () => axios.post('/auth/me');

// Users
export const getUsers = () => axios.get('/users');
export const getUser = (id) => axios.get(`/users/${id}`);
export const createUser = (payload) => axios.post('/users', payload);
export const updateUser = (payload, id) => axios.put(`/users/${id}`, payload);
export const uploadUsers = (payload) => axios.post('/users/storeUsers', payload);
export const deleteUser = (id) => axios.delete(`/users/${id}`);

// Roles
export const getRoles = () => axios.get('/roles');
export const updateRole = (payload, name) => axios.put(`roles/user/${name}`, payload);
export const assignRole = (payload) => axios.put('/roles/user', payload);
export const removeRole = (payload) => axios.delete('/roles/user', payload);
