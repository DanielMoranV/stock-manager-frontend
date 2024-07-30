<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount, watch } from 'vue';
import { useUsersStore } from '../../stores/users';
import { useRolesStore } from '../../stores/roles';
import { useToast } from 'primevue/usetoast';
import { validateDNI, validateEmail, validatePhone, capitalizeName, restrictToNumbers } from '@/utils/validationUtils';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Estado de carga
const isLoading = ref(false);
const loadingUsers = ref(false);

// Referencias y datos
const userStore = useUsersStore();
const rolesStore = useRolesStore();
const toast = useToast();

const users = ref(null);
const userDialog = ref(false);
const deleteUserDialog = ref(false);
const deleteUsersDialog = ref(false);
const user = ref({});
const selectedUsers = ref(null);
const roles = ref([]);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);

// Estados de validación
const isDNIValid = ref(true);
const isEmailValid = ref(true);
const isPhoneValid = ref(true);

// Inicializar filtros
const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

// Validar campos
const validateFields = () => {
    validateDNIField();
    validateEmailField();
    validatePhoneField();
};

// Verificar si el formulario es válido
const isFormValid = () => {
    return user.value.name && user.value.name.trim() && user.value.email && user.value.role.name && isDNIValid.value && isEmailValid.value && isPhoneValid.value;
};

// Manejar entrada de nombre
const handleNameInput = () => {
    user.value.name = capitalizeName(user.value.name);
};

// Validar DNI
const validateDNIField = () => {
    isDNIValid.value = validateDNI(user.value.dni);
};

// Validar email
const validateEmailField = () => {
    isEmailValid.value = validateEmail(user.value.email);
};

// Validar teléfono
const validatePhoneField = () => {
    isPhoneValid.value = validatePhone(user.value.phone);
};

// Encontrar índice por ID
const findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < users.value.length; i++) {
        if (users.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

// Exportar a Excel
const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

    // Definir columnas y encabezados
    worksheet.columns = [
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Rol', key: 'role', width: 15 },
        { header: 'Compañia', key: 'company', width: 15 }
    ];

    // Agregar datos y aplicar estilos a las celdas
    users.value.forEach((user) => {
        const row = worksheet.addRow({
            dni: user.dni,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role.name,
            company: user.company.company_name
        });

        // Aplicar estilo a las celdas de la fila
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { color: { argb: '000000' } }; // Color del texto
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'CCCCCC' } },
                left: { style: 'thin', color: { argb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                right: { style: 'thin', color: { argb: 'CCCCCC' } }
            };
        });
    });

    // Aplicar estilo a las celdas de encabezado
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4F81BD' } // Color de fondo azul
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Guardar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Usuarios.xlsx');
};

// Abrir diálogo de nuevo usuario
const openNew = () => {
    user.value = {
        role: {
            name: 'admin'
        }
    };
    submitted.value = false;
    userDialog.value = true;
};

// Ocultar diálogo
const hideDialog = () => {
    userDialog.value = false;
    submitted.value = false;
};

// Guardar usuario
const saveUser = async () => {
    submitted.value = true;
    validateFields();

    if (!isFormValid()) {
        return;
    }

    isLoading.value = true;
    loadingUsers.value = true;

    try {
        if (user.value.id) {
            await updateUser();
        } else {
            await createUser();
        }

        userDialog.value = false;
        user.value = {};
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar usuario', life: 3000 });
    } finally {
        isLoading.value = false;
        loadingUsers.value = false;
    }
};

// Actualizar usuario
const updateUser = async () => {
    await userStore.updateUser(user.value, user.value.id);

    const payloadRole = { name: user.value.role.name };
    await rolesStore.updateRole(payloadRole);

    const userIndex = findIndexById(user.value.id);
    users.value[userIndex] = user.value;

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado', life: 3000 });
};

// Crear usuario
const createUser = async () => {
    const response = await userStore.createUser(user.value);

    if (response == '422') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Usuario ya registrado, error en validación', life: 3000 });
        isLoading.value = false;
        loadingUsers.value = false;
        userDialog.value = false;
        user.value = {};
        return;
    }

    user.value = response;
    await rolesStore.assignRole({ dni: user.value.dni, role_name: user.value.role.name });
    users.value.push(user.value);

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nuevo usuario agregado', life: 3000 });
};

// Editar usuario
const editUser = (editUser) => {
    user.value = { ...editUser };
    userDialog.value = true;
};

// Confirmar eliminación de usuario
const confirmDeleteUser = (editUser) => {
    user.value = editUser;
    deleteUserDialog.value = true;
};

// Eliminar usuario
const deleteUser = async () => {
    const response = await userStore.deleteUser(user.value.id);
    if (response.success == true) {
        users.value = users.value.filter((val) => val.id !== user.value.id);
        deleteUserDialog.value = false;
        user.value = {};
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario Eliminado', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al elimar usuario', life: 3000 });
    }
};

// Confirmar eliminación de usuarios seleccionados
const confirmDeleteSelected = () => {
    deleteUsersDialog.value = true;
};

// Eliminar usuarios seleccionados
const deleteSelectedUsers = async () => {
    const selectedUserIds = selectedUsers.value.map((user) => user.id);
    const successfulDeletes = [];
    const failedDeletes = [];

    for (const id of selectedUserIds) {
        try {
            const response = await userStore.deleteUser(id);
            if (response.success) {
                successfulDeletes.push(id);
            } else {
                failedDeletes.push(id);
            }
        } catch (error) {
            failedDeletes.push(id);
        }
    }

    // Filtrar la lista de usuarios en el frontend
    users.value = users.value.filter((val) => !successfulDeletes.includes(val.id));
    deleteUsersDialog.value = false;
    selectedUsers.value = null;

    if (failedDeletes.length > 0) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Algunos usuarios no pudieron ser eliminados', life: 3000 });
    } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuarios Eliminados', life: 3000 });
    }
};
// Ciclos de vida del componente
onBeforeMount(() => {
    initFilters();
});

onMounted(async () => {
    loadingUsers.value = true;
    await userStore.getUsers().then((data) => (users.value = data));
    await rolesStore.getRolesComboBox().then((data) => (roles.value = data));
    loadingUsers.value = false;
});

// Importar Datos Excel
const onUpload = async (event) => {
    const file = event.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(file);
            const worksheet = workbook.worksheets[0];
            const rows = worksheet.getSheetValues();

            // Procesar los datos del archivo
            const usersData = rows.slice(2).map((row) => ({
                dni: row[1],
                name: row[2],
                phone: row[3],
                email: row[4],
                role: row[5]
            }));
            // Enviar los datos a la base de datos
            await uploadUsers(usersData);
        } catch (error) {
            console.error('Error al procesar el archivo', error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el archivo', life: 3000 });
        }
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Formato de archivo no válido', life: 3000 });
    }
};

const uploadUsers = async (usersData) => {
    try {
        // Enviar los datos al backend
        const response = await userStore.uploadUsers(usersData);
        await userStore.getUsers().then((data) => (users.value = data));
        if (response.success.length != 0) {
            response.success.length;
            toast.add({ severity: 'success', summary: 'Éxito', detail: response.success.length + ' Datos importados correctamente', life: 3000 });
        }
        if (response.errors.length != 0) {
            response.success.length;
            toast.add({ severity: 'error', summary: 'Éxito', detail: response.errors.length + ' Datos importados incorrectamente', life: 3000 });
        }
        //users.value.push(...response.success);
    } catch (error) {
        console.error('Error al subir los datos', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al importar los datos', life: 3000 });
    }
};

// Watchers
watch(() => user.value.dni, validateDNIField);
watch(() => user.value.email, validateEmailField);
watch(() => user.value.phone, validatePhoneField);
</script>

<template>
    <div class="card">
        <Toolbar class="mb-4">
            <template v-slot:start>
                <div class="my-2">
                    <Button label="Nuevo" icon="pi pi-plus" class="mr-2" severity="success" @click="openNew" />
                    <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedUsers || !selectedUsers.length" />
                </div>
            </template>

            <template v-slot:end>
                <FileUpload mode="basic" accept=".xlsx" :maxFileSize="1000000" label="Importar" chooseLabel="Carga masiva" class="mr-2 inline-block" :auto="true" @select="onUpload($event)" />
                <Button label="Exportar Excel" icon="pi pi-file-excel" severity="info" @click="exportExcel" />
            </template>
        </Toolbar>

        <DataTable
            ref="dt"
            :value="users"
            v-model:selection="selectedUsers"
            dataKey="id"
            :paginator="true"
            :loading="loadingUsers"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
        >
            <template #header>
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Gestión de Usuarios</h5>
                    <IconField iconPosition="left" class="block mt-2 md:mt-0">
                        <InputIcon class="pi pi-search" />
                        <InputText class="w-full sm:w-auto" v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="dni" header="DNI" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    <span class="p-column-title">DNI</span>
                    {{ slotProps.data.dni }}
                </template>
            </Column>
            <Column field="name" header="Nombre" :sortable="true" headerStyle="width:25%; min-width:10rem;">
                <template #body="slotProps">
                    <span class="p-column-title">Nombre</span>
                    {{ slotProps.data.name }}
                </template>
            </Column>
            <Column field="phone" header="Teléfono" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    <span class="p-column-title">Teléfono</span>
                    {{ slotProps.data.phone }}
                </template>
            </Column>
            <Column field="email" header="Email" :sortable="true" headerStyle="width:20%; min-width:10rem;">
                <template #body="slotProps">
                    <span class="p-column-title">Email</span>
                    {{ slotProps.data.email }}
                </template>
            </Column>
            <Column field="role.name" header="Rol" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                <template #body="slotProps">
                    <span class="p-column-title">Rol</span>
                    {{ slotProps.data.role.name.toUpperCase() }}
                </template>
            </Column>
            <Column field="company.company_name" header="Compañia" :sortable="true" headerStyle="width:14%; min-width:10rem;">
                <template #body="slotProps">
                    <span class="p-column-title">Compañia</span>
                    {{ slotProps.data.company.company_name.toUpperCase() }}
                </template>
            </Column>
            <Column headerStyle="min-width:10rem;">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded @click="editUser(slotProps.data)" />
                    <Button icon="pi pi-trash" class="mt-2" severity="warning" rounded @click="confirmDeleteUser(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" header="Detalle de Usuario" :modal="true" class="p-fluid">
            <div class="field">
                <label for="name">Nombre</label>
                <InputText id="name" v-model.trim="user.name" @input="handleNameInput" required autofocus :invalid="submitted && !user.name" />
                <small class="p-invalid" v-if="submitted && !user.name">Nombre es requerido.</small>
            </div>
            <div class="field">
                <label for="dni">DNI</label>
                <InputText id="dni" v-model.trim="user.dni" @input="validateDNIField" @keypress="restrictToNumbers" required autofocus :invalid="submitted && !isDNIValid" maxlength="8" />
                <small class="p-invalid" v-if="submitted && !isDNIValid">DNI es inválido o requerido.</small>
            </div>
            <div class="field">
                <label for="email">Correo Electrónico</label>
                <InputText id="email" v-model.trim="user.email" @input="validateEmailField" required autofocus :invalid="submitted && !isEmailValid" />
                <small class="p-invalid" v-if="submitted && !isEmailValid">Correo electrónico es inválido o requerido.</small>
            </div>
            <div class="field">
                <label for="phone">Teléfono</label>
                <InputText id="phone" v-model.trim="user.phone" @input="validatePhoneField" @keypress="restrictToNumbers" required autofocus :invalid="submitted && !isPhoneValid" maxlength="9" />
                <small class="p-invalid" v-if="submitted && !isPhoneValid">Teléfono es inválido o requerido.</small>
            </div>
            <div class="field">
                <label for="rol" class="mb-3">Roles</label>
                <Dropdown id="rol" v-model="user.role.name" :options="roles" optionLabel="label" optionValue="value" placeholder="Selecciona Rol">
                    <template #value="slotProps">
                        <div v-if="slotProps.value && slotProps.value.value">
                            <span :class="'user-badge status-' + slotProps.value.value">{{ slotProps.value.label }}</span>
                        </div>
                        <div v-else-if="slotProps.value && !slotProps.value.value">
                            <span :class="'user-badge status-' + slotProps.value.toLowerCase()">{{ slotProps.value }}</span>
                        </div>
                        <span v-else>
                            {{ slotProps.placeholder }}
                        </span>
                    </template>
                </Dropdown>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text :loading="isLoading" @click="saveUser" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUserDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="user"
                    >Are you sure you want to delete <b>{{ user.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUserDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteUser" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUsersDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="user">Are you sure you want to delete the selected users?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUsersDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedUsers" />
            </template>
        </Dialog>
    </div>
</template>
