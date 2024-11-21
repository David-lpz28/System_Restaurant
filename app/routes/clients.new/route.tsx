// app/routes/clients/new.tsx

import {
  Form,
  Link,
  useNavigation,
  useLoaderData,
} from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { prisma } from '~/db.server';
import { getSession, commitSession } from '../../../sessions.server';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useEffect, useState } from 'react';

// Tipos para los datos de acción y carga
interface LoaderData {
  successMessage?: string;
  errorMessage?: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const successMessage = session.get('success');
  const errorMessage = session.get('error');

  return json<LoaderData>(
    { successMessage, errorMessage },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    }
  );
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
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
    session.flash('error', 'Todos los campos son obligatorios.');
    return redirect('/clients/new', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  // Validación del formato del número de teléfono usando libphonenumber-js
  const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, 'US'); // Cambia 'US' por el código de país correspondiente
  if (!phoneNumberParsed || !phoneNumberParsed.isValid()) {
    session.flash('error', 'Formato de número de teléfono inválido.');
    return redirect('/clients/new', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  // Formatear el número de teléfono en formato internacional
  const formattedPhoneNumber = phoneNumberParsed.formatInternational();

  // Crear el nuevo cliente en la base de datos
  try {
    await prisma.client.create({
      data: {
        firstName,
        lastName,
        phoneNumber: formattedPhoneNumber,
        address,
      },
    });
    session.flash('success', 'Cliente creado exitosamente.');
    return redirect('/clients', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error) {
    console.error('Error al crear el cliente:', error);
    session.flash('error', 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.');
    return redirect('/clients/new', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

export default function NewClient() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const { successMessage, errorMessage } = useLoaderData<LoaderData>();
  const [displaySuccess, setDisplaySuccess] = useState<string | null>(successMessage || null);
  const [displayError, setDisplayError] = useState<string | null>(errorMessage || null);

  useEffect(() => {
    if (successMessage) {
      setDisplaySuccess(successMessage);
      // Limpiar el mensaje después de mostrarlo
      const timer = setTimeout(() => {
        setDisplaySuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }

    if (errorMessage) {
      setDisplayError(errorMessage);
      // Limpiar el mensaje después de mostrarlo
      const timer = setTimeout(() => {
        setDisplayError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Crear Nuevo Cliente</h1>

      {/* Mensaje de Éxito */}
      {displaySuccess && <p style={{ color: 'green' }}>{displaySuccess}</p>}

      {/* Mensaje de Error */}
      {displayError && <p style={{ color: 'red' }}>{displayError}</p>}

      {/* Formulario para Crear Cliente */}
      <Form method="post">
        <div style={{ marginBottom: '10px' }}>
          <label>
            Nombre:
            <input
              type="text"
              name="firstName"
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="Ingresa el nombre"
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Apellido:
            <input
              type="text"
              name="lastName"
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="Ingresa el apellido"
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Número de Teléfono:
            <input
              type="tel"
              name="phoneNumber"
              required
              pattern="^\+?[1-9]\d{1,14}$"
              title="Por favor, ingresa un número de teléfono válido."
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="+1234567890"
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Dirección:
            <input
              type="text"
              name="address"
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="Ingresa la dirección"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            backgroundColor: isSubmitting ? '#ccc' : '#28a745',
            color: '#fff',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Creando...' : 'Crear Cliente'}
        </button>
      </Form>

      {/* Botón para Volver a la Lista de Clientes */}
      <div style={{ marginTop: '20px' }}>
        <Link to="/clients">
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Volver a la Lista de Clientes
          </button>
        </Link>
      </div>
    </div>
  );
}

// Error Boundary para manejar errores en esta ruta
import { useRouteError, isRouteErrorResponse } from '@remix-run/react';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Error {error.status}</h1>
        <p>{error.statusText}</p>
        {error.data && <pre>{JSON.stringify(error.data, null, 2)}</pre>}
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Ocurrió un error inesperado</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === 'development' && <pre>{error.stack}</pre>}
      </div>
    );
  } else {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Error desconocido</h1>
      </div>
    );
  }
}
