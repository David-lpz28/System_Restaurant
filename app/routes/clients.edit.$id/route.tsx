import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { redirect, json } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  Link,
} from '@remix-run/react';
import { prisma } from '~/db.server';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Definir tipos para los datos del cliente
type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
};

// Definir el tipo de datos de acción
interface ActionData {
  formError?: string;
}

// Loader para obtener los datos del cliente por ID
export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) {
    throw new Response('No se proporcionó ID del cliente', { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    throw new Response('Cliente no encontrado', { status: 404 });
  }

  return json({ client });
};

// Action para manejar la sumisión del formulario de edición
export const action: ActionFunction = async ({ request, params }) => {
  const { id } = params;
  if (!id) {
    return json({ formError: 'No se proporcionó ID del cliente.' }, { status: 400 });
  }

  const formData = await request.formData();
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const phoneNumber = formData.get('phoneNumber');
  const address = formData.get('address');

  // Validación de campos requeridos
  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof phoneNumber !== 'string' ||
    typeof address !== 'string' ||
    !firstName.trim() ||
    !lastName.trim() ||
    !phoneNumber.trim() ||
    !address.trim()
  ) {
    return json(
      { formError: 'Todos los campos son obligatorios.' },
      { status: 400 }
    );
  }

  // Validación del formato del número de teléfono usando libphonenumber-js
  const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, 'US'); // Cambia 'US' por el código de país correspondiente
  if (!phoneNumberParsed || !phoneNumberParsed.isValid()) {
    return json(
      { formError: 'Formato de número de teléfono inválido.' },
      { status: 400 }
    );
  }

  // Formatear el número de teléfono en formato internacional
  const formattedPhoneNumber = phoneNumberParsed.formatInternational();

  // Actualizar el cliente en la base de datos
  try {
    await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phoneNumber: formattedPhoneNumber,
        address,
      },
    });
    // Redirigir a la lista de clientes con un mensaje de éxito
    return redirect('/clients?success=true');
  } catch (error) {
    console.error('Error al actualizar el cliente:', error);
    return json(
      { formError: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.' },
      { status: 500 }
    );
  }
};

export default function EditClient() {
  const { client } = useLoaderData<{ client: Client }>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div>
      <h1>Editar Cliente</h1>
      {actionData?.formError && (
        <p style={{ color: 'red' }}>{actionData.formError}</p>
      )}
      <Form method="post">
        <div>
          <label>
            Nombre:
            <input
              type="text"
              name="firstName"
              defaultValue={client.firstName}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Apellido:
            <input
              type="text"
              name="lastName"
              defaultValue={client.lastName}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Número de Teléfono:
            <input
              type="tel"
              name="phoneNumber"
              defaultValue={client.phoneNumber}
              required
              pattern="^\+?[1-9]\d{1,14}$"
              title="Por favor, ingresa un número de teléfono válido."
            />
          </label>
        </div>
        <div>
          <label>
            Dirección:
            <input
              type="text"
              name="address"
              defaultValue={client.address}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Actualizando...' : 'Actualizar Cliente'}
        </button>
      </Form>
      <Link to="/clients">
        <button>Volver a la Lista de Clientes</button>
      </Link>
    </div>
  );
}

// Error Boundary para manejar errores en esta ruta
import { useRouteError, isRouteErrorResponse } from '@remix-run/react';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>Error {error.status}</h1>
        <p>{error.statusText}</p>
        {error.data && <pre>{JSON.stringify(error.data, null, 2)}</pre>}
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Ocurrió un error inesperado</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === 'development' && <pre>{error.stack}</pre>}
      </div>
    );
  } else {
    return <h1>Error desconocido</h1>;
  }
}
