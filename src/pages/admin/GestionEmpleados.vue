<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md text-h5">Gestión de Empleados</div>

    <q-btn color="primary" label="Agregar Empleado" icon="add" class="q-mb-md" @click="abrirDialogoAgregar" />

    <q-table
      flat
      bordered
      :rows="empleados"
      :columns="columnas"
      row-key="id"
      :loading="loading"
    >
      <template v-slot:body-cell-contraseña="props">
        <q-td :props="props">
          <div class="row items-center">
            <span>{{ ocultarContraseña(props.row.contraseña) }}</span>
            <q-btn flat round size="sm" icon="visibility" @click="mostrarContraseña(props.row)" />
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-acciones="props">
        <q-td :props="props">
          <q-btn size="sm" color="warning" icon="edit" class="q-mr-sm" @click="editarEmpleado(props.row)" />
          <q-btn size="sm" color="negative" icon="delete" @click="abrirDialogoEliminar(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogoAgregar">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ modoEdicion ? 'Editar' : 'Registrar Nuevo' }} Empleado</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="modoEdicion ? actualizarEmpleado() : registrarEmpleado()" class="q-gutter-md">
            <q-input
              v-model="nuevoEmpleado.nombre"
              label="Nombre"
              :rules="[val => !!val || 'El nombre es requerido']"
            />

            <q-input
              v-model="nuevoEmpleado.correo"
              label="Correo"
              type="email"
            />

            <q-input
              v-model="nuevoEmpleado.contraseña"
              label="Contraseña"
              :type="mostrarPass ? 'text' : 'password'"
              :rules="[val => !!val || 'La contraseña es requerida']"
            >
              <template v-slot:append>
                <q-icon
                  :name="mostrarPass ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrarPass = !mostrarPass"
                />
              </template>
            </q-input>

            <q-input
              v-if="!modoEdicion"
              v-model="confirmarContraseña"
              label="Confirmar Contraseña"
              :type="mostrarConfirmPass ? 'text' : 'password'"
              :rules="[
                val => !!val || 'La confirmación es requerida',
                val => val === nuevoEmpleado.contraseña || 'Las contraseñas no coinciden'
              ]"
            >
              <template v-slot:append>
                <q-icon
                  :name="mostrarConfirmPass ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrarConfirmPass = !mostrarConfirmPass"
                />
              </template>
            </q-input>

            <q-select
              v-model="nuevoEmpleado.rol"
              :options="['administrador', 'mesero', 'chef']"
              label="Rol"
              :rules="[val => !!val || 'El rol es requerido']"
            />

            <div class="q-mt-md">
              <q-btn label="Cancelar" @click="cerrarDialogoAgregar" class="q-mr-sm" />
              <q-btn :label="modoEdicion ? 'Actualizar' : 'Registrar'" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoEliminar">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirmar Eliminación</div>
          <p>¿Estás seguro de que deseas eliminar a {{ empleadoAEliminar?.nombre }}?</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="cerrarDialogoEliminar" />
          <q-btn flat label="Eliminar" color="negative" @click="confirmarEliminarEmpleado" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoVerificarAdmin">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Verificar Administrador</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="contraseñaAdmin"
            label="Contraseña de Administrador"
            type="password"
            @keyup.enter="verificarContraseñaAdmin"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="cancelarVerificacion" />
          <q-btn flat label="Verificar" color="primary" @click="verificarContraseñaAdmin" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { supabase } from 'src/boot/supabase';

export default {
  setup() {
    const $q = useQuasar();
    const loading = ref(false);
    const empleados = ref([]);
    const mostrarPass = ref(false);
    const mostrarConfirmPass = ref(false);
    const modoEdicion = ref(false);

    const dialogoAgregar = ref(false);
    const dialogoEliminar = ref(false);
    const dialogoVerificarAdmin = ref(false);

    const nuevoEmpleado = ref({
      nombre: '',
      correo: '',
      contraseña: '',
      rol: ''
    });
    const confirmarContraseña = ref('');
    const empleadoAEliminar = ref(null);
    const contraseñaAdmin = ref('');
    const empleadoSeleccionado = ref(null);

    const columnas = [
      { name: 'nombre', label: 'Nombre', align: 'left', field: 'nombre', sortable: true },
      { name: 'correo', label: 'Correo', align: 'left', field: 'correo', sortable: true },
      { name: 'contraseña', label: 'Contraseña', align: 'left', field: 'contraseña' },
      { name: 'rol', label: 'Rol', align: 'left', field: 'rol', sortable: true },
      { name: 'acciones', label: 'Acciones', align: 'center' }
    ];

    onMounted(async () => {
      await cargarEmpleados();
    });

    const ocultarContraseña = (contraseña) => {
      return contraseña ? '*'.repeat(Math.min(contraseña.length, 8)) : '';
    };

    async function cargarEmpleados() {
      try {
        loading.value = true;
        console.log('Cargando empleados...');

        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error('Error al cargar empleados:', error);
          throw error;
        }

        console.log('Empleados cargados:', data);
        empleados.value = data;

      } catch (error) {
        console.error('Error completo:', error);
        $q.notify({
          color: 'negative',
          message: 'Error al cargar empleados: ' + error.message,
          position: 'top'
        });
      } finally {
        loading.value = false;
      }
    }

    const abrirDialogoAgregar = () => {
      modoEdicion.value = false;
      nuevoEmpleado.value = { nombre: '', correo: '', contraseña: '', rol: '' };
      confirmarContraseña.value = '';
      dialogoAgregar.value = true;
    };

    const cerrarDialogoAgregar = () => {
      dialogoAgregar.value = false;
      nuevoEmpleado.value = { nombre: '', correo: '', contraseña: '', rol: '' };
      confirmarContraseña.value = '';
      modoEdicion.value = false;
    };

    async function registrarEmpleado(e) {
      if (e) e.preventDefault()

      try {
        if (!nuevoEmpleado.value.nombre || !nuevoEmpleado.value.contraseña || !nuevoEmpleado.value.rol) {
          console.log('Datos del formulario:', nuevoEmpleado.value)
          $q.notify({
            color: 'negative',
            message: 'Todos los campos son requeridos',
            position: 'top'
          })
          return
        }

        if (nuevoEmpleado.value.contraseña !== confirmarContraseña.value) {
          $q.notify({
            color: 'negative',
            message: 'Las contraseñas no coinciden',
            position: 'top'
          })
          return
        }

        loading.value = true
        console.log('Iniciando registro de empleado...')

        const empleadoData = {
          nombre: nuevoEmpleado.value.nombre,
          correo: nuevoEmpleado.value.correo,
          contraseña: nuevoEmpleado.value.contraseña,
          rol: nuevoEmpleado.value.rol
        }

        console.log('Datos a insertar:', { ...empleadoData, contraseña: '*****' })

        const { data, error } = await supabase
          .from('usuarios')
          .insert([empleadoData])

        if (error) {
          console.error('Error de Supabase:', error)
          throw error
        }

        console.log('Respuesta de Supabase:', data)

        await cargarEmpleados()

        cerrarDialogoAgregar()
        $q.notify({
          color: 'positive',
          message: 'Empleado registrado exitosamente',
          position: 'top'
        })

      } catch (error) {
        console.error('Error completo:', error)
        $q.notify({
          color: 'negative',
          message: error.message || 'Error al registrar empleado',
          position: 'top',
          timeout: 5000
        })
      } finally {
        loading.value = false
      }
    }

    const accionPendiente = ref(null);

    const editarEmpleado = (empleado) => {
      empleadoSeleccionado.value = empleado;
      accionPendiente.value = 'editar';
      dialogoVerificarAdmin.value = true;
      contraseñaAdmin.value = '';
    };

    const abrirDialogoEliminar = (empleado) => {
      empleadoSeleccionado.value = empleado;
      accionPendiente.value = 'eliminar';
      dialogoVerificarAdmin.value = true;
      contraseñaAdmin.value = '';
    };

    const mostrarContraseña = (empleado) => {
      empleadoSeleccionado.value = empleado;
      accionPendiente.value = 'mostrarContraseña';
      dialogoVerificarAdmin.value = true;
      contraseñaAdmin.value = '';
    };

    const cancelarVerificacion = () => {
      dialogoVerificarAdmin.value = false;
      contraseñaAdmin.value = '';
      empleadoSeleccionado.value = null;
      accionPendiente.value = null;
    };

    async function verificarContraseñaAdmin() {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('rol', 'administrador')
          .eq('contraseña', contraseñaAdmin.value)
          .single();

        if (error || !data) {
          throw new Error('Contraseña de administrador incorrecta');
        }

        switch (accionPendiente.value) {
          case 'editar':
            modoEdicion.value = true;
            nuevoEmpleado.value = { ...empleadoSeleccionado.value };
            dialogoAgregar.value = true;
            break;
          case 'eliminar':
            empleadoAEliminar.value = empleadoSeleccionado.value;
            dialogoEliminar.value = true;
            break;
          case 'mostrarContraseña':
            $q.notify({
              color: 'positive',
              message: `Contraseña del empleado: ${empleadoSeleccionado.value?.contraseña}`
            });
            break;
        }

        cancelarVerificacion();
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: error.message
        });
      }
    }

    async function actualizarEmpleado() {
      try {
        loading.value = true;
        const { error } = await supabase
          .from('usuarios')
          .update(nuevoEmpleado.value)
          .eq('id', nuevoEmpleado.value.id);

        if (error) throw error;

        await cargarEmpleados();
        cerrarDialogoAgregar();
        $q.notify({
          color: 'positive',
          message: 'Empleado actualizado exitosamente'
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Error al actualizar empleado: ' + error.message
        });
      } finally {
        loading.value = false;
      }
    }

    const cerrarDialogoEliminar = () => {
      dialogoEliminar.value = false;
      empleadoAEliminar.value = null;
    };

    async function confirmarEliminarEmpleado() {
      if (!empleadoAEliminar.value?.id) return;

      try {
        loading.value = true;
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', empleadoAEliminar.value.id);

        if (error) throw error;

        await cargarEmpleados();
        cerrarDialogoEliminar();
        $q.notify({
          color: 'positive',
          message: 'Empleado eliminado exitosamente'
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Error al eliminar empleado: ' + error.message
        });
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      empleados,
      columnas,
      dialogoAgregar,
      dialogoEliminar,
      dialogoVerificarAdmin,
      nuevoEmpleado,
      confirmarContraseña,
      empleadoAEliminar,
      contraseñaAdmin,
      empleadoSeleccionado,
      mostrarPass,
      mostrarConfirmPass,
      modoEdicion,
      ocultarContraseña,
      abrirDialogoAgregar,
      cerrarDialogoAgregar,
      registrarEmpleado,
      editarEmpleado,
      actualizarEmpleado,
      abrirDialogoEliminar,
      cerrarDialogoEliminar,
      confirmarEliminarEmpleado,
      mostrarContraseña,
      cancelarVerificacion,
      verificarContraseñaAdmin,
      accionPendiente
    };
  }
};
</script>




