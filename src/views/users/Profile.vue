<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

const user = ref({});

const router = useRouter();

const saveProfile = () => {
    // Lógica para guardar el perfil del usuario
    console.log('Perfil guardado:', user.value);
};

const cancelEdit = () => {
    // Lógica para cancelar la edición
    console.log('Edición cancelada');
};

onMounted(async () => {
    const data = await authStore.me();
    user.value = data.user;
});
</script>
<template>
    <div class="p-grid p-justify-center p-mt-5">
        <div class="p-col-12 p-md-8 p-lg-6">
            <Card>
                <template #header>
                    <div class="profile-header">
                        <Avatar image="https://via.placeholder.com/150" size="xlarge" shape="circle" class="mr-3" />
                        <div>
                            <h2>{{ user.name }}</h2>
                            <p>{{ user.role }}</p>
                        </div>
                    </div>
                </template>
                <template #content>
                    <div class="p-fluid">
                        <div class="field">
                            <label for="name">Nombre</label>
                            <InputText id="name" v-model="user.name" />
                        </div>

                        <div class="field">
                            <label for="email">Email</label>

                            <InputText id="email" v-model="user.email" />
                        </div>

                        <div class="field">
                            <label for="phone">Teléfono</label>

                            <InputText id="phone" v-model="user.phone" />
                        </div>

                        <div class="field">
                            <label for="company">Compañia</label>

                            <InputText id="company" v-model="user.company" />
                        </div>
                    </div>
                </template>

                <template #footer>
                    <div class="p-d-flex">
                        <Button label="Guardar" icon="pi pi-check" class="p-button-success mb-2 mr-2" @click="saveProfile" />
                        <Button label="Cancelar" icon="pi pi-times" class="p-button-secondary mb-2 mr-2" @click="cancelEdit" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.profile-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: var(--surface-d);
    color: var(--text-color);
    border-radius: 5px 5px 0 0;
}

.profile-header h2 {
    margin: 0;
}

.profile-header p {
    margin: 0;
    color: var(--text-secondary-color);
}
</style>
