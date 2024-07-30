import { defineStore } from 'pinia';
import cache from '../utils/cache';
import { getRoles, assignRole, removeRole, updateRole } from '../api';
import router from '../router';

export const useRolesStore = defineStore('rolesStore', {
    state: () => ({
        roles: cache.getItem('roles'),
        msg: {},
        loading: false
    }),
    actions: {
        async getRoles() {
            try {
                const data = await getRoles();
                const roles = data.roles;
                cache.setItem('roles', roles);
                this.roles = roles;
                this.loading = true;
            } catch (error) {
                //console.log(error);
                this.msg = error.message;
                this.roles = null;
            }
            return this.roles;
        },
        async getRolesComboBox() {
            try {
                const { data } = await getRoles();
                const roles = data.map((role) => {
                    return { label: role.name, value: role.name };
                });
                cache.setItem('roles', roles);
                this.roles = roles;
                this.loading = true;
            } catch (error) {
                //console.log(error);
                this.msg = error.message;
                this.roles = null;
            }
            return this.roles;
        },
        async assignRole(payload) {
            try {
                this.msg = await assignRole(payload);
            } catch (error) {
                this.msg = error.message;
            }
            return this.msg;
        },
        async updateRole(payload) {
            try {
                this.msg = await updateRole(payload, payload.name);
            } catch (error) {
                this.msg = error.message;
            }
        }
    }
});
