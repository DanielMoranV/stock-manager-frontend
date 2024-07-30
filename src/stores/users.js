import { defineStore } from 'pinia';
import cache from '../utils/cache';
import { getUsers, createUser, updateUser, getUser, uploadUsers, deleteUser } from '../api';
import router from '../router';

export const useUsersStore = defineStore('userStore', {
    state: () => ({
        users: cache.getItem('users'),
        user: null,
        msg: {},
        status: null,
        loading: false
    }),
    actions: {
        async getUsers() {
            try {
                const { data } = await getUsers();
                cache.setItem('users', data);
                data.forEach((user) => {
                    if (!user.role) {
                        user.role = { name: 'No Asignado' };
                    }

                    if (!user.company) {
                        user.company = { company_name: 'No Asignado' };
                    }
                });
                this.users = data;
                this.loading = true;
            } catch (error) {
                //console.log(error);
                this.msg = error.message;
                this.users = null;
            }
            return this.users;
        },
        async createUser(payload) {
            try {
                payload.password = payload.dni;
                payload.password_confirmation = payload.dni;
                payload.role = payload.role.name;
                const { data } = await createUser(payload);
                const user = await getUser(data.id);
                this.user = user.data;
            } catch (error) {
                this.msg = error.message;
                this.user = null;
                this.status = error.status_code;
                return this.status;
            }
            return this.user;
        },
        async uploadUsers(payload) {
            const dataUsers = payload.map((user) => ({
                dni: user.dni,
                name: user.name,
                phone: user.phone,
                email: user.email,
                password: user.dni,
                password_confirmation: user.dni,
                role: user.role
            }));

            const requestData = { users: dataUsers };

            try {
                const { data } = await uploadUsers(requestData);
                console.log(data);
                //this.users.push(...data.success);
                this.msg = data.message;
                return data;
            } catch (error) {
                this.msg = error.message;
                this.users = null;
                this.status = error.status_code;
                console.log(error);
                return this.status;
            }
        },
        async updateUser(payload, id) {
            try {
                const data = await updateUser(payload, id);
                this.user = data;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },
        async deleteUser(id) {
            try {
                const response = await deleteUser(id);
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        }
    }
});
