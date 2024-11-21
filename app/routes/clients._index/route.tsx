import {Link, useLoaderData, Form, useNavigation,} from '@remix-run/react';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { prisma } from '~/db.server';
import { useEffect, useState } from 'react';
import { getSession, commitSession } from '../../../sessions.server'; 

// Definir el tipo de datos para el cliente
type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
};

// Definir el tipo de datos del loader
type LoaderData = {
  clients: Client[];
  successMessage?: string;
  errorMessage?: string;
};

// Loader para obtener la lista de clientes y mensajes flash
export const loader: LoaderFunction = async ({ request }) => {
  const clients: Client[] = await prisma.client.findMany({
    orderBy: { firstName: 'asc' },
  });

  const session = await getSession(request.headers.get('Cookie'));
  const successMessage = session.get('success');
  const errorMessage = session.get('error');

  return json<LoaderData>(
    { clients, successMessage, errorMessage },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    }
  );
};

// Action para manejar la eliminación del cliente
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const clientId = formData.get('id');

  if (typeof clientId !== 'string') {
    const session = await getSession(request.headers.get('Cookie'));
    session.flash('error', 'ID de cliente inválido.');
    return redirect('/clients', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  try {
    await prisma.client.delete({
      where: { id: clientId },
    });
    const session = await getSession(request.headers.get('Cookie'));
    session.flash('success', 'Cliente eliminado exitosamente.');
    return redirect('/clients', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error) {
    console.error('Error al eliminar el cliente:', error);
    const session = await getSession(request.headers.get('Cookie'));
    session.flash('error', 'No se pudo eliminar el cliente.');
    return redirect('/clients', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

export default function ClientsList() {
  const { clients, successMessage, errorMessage } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const [displaySuccess, setDisplaySuccess] = useState<string | null>(successMessage || null);
  const [displayError, setDisplayError] = useState<string | null>(errorMessage || null);

  useEffect(() => {
    if (successMessage) {
      setDisplaySuccess(successMessage);
      // Limpiar el mensaje después de mostrarlo
      setTimeout(() => {
        setDisplaySuccess(null);
      }, 5000);
    }

    if (errorMessage) {
      setDisplayError(errorMessage);
      // Limpiar el mensaje después de mostrarlo
      setTimeout(() => {
        setDisplayError(null);
      }, 5000);
    }
  }, [successMessage, errorMessage]);

  return (
    <div>
      <h1>Lista de Clientes</h1>
      {displaySuccess && <p style={{ color: 'green' }}>{displaySuccess}</p>}
      {displayError && <p style={{ color: 'red' }}>{displayError}</p>}
      <Link to="/clients/new">
        <button>Crear Nuevo Cliente</button>
      </Link>
      <ul>
        {clients.map((client) => {
          const isDeleting =
            navigation.formData?.get('id') === client.id &&
            navigation.state === 'submitting';

          return (
            <li key={client.id} style={{ marginTop: '10px' }}>
              <span>
                {client.firstName} {client.lastName} - {client.phoneNumber} - {client.address}
              </span>
              <Link to={`/clients/edit/${client.id}`} style={{ marginLeft: '10px' }}>
                <button>Editar</button>
              </Link>
              <Form
                method="post"
                onSubmit={(event) => {
                  if (!confirm(`¿Estás seguro de que deseas eliminar a ${client.firstName} ${client.lastName}?`)) {
                    event.preventDefault();
                  }
                }}
                style={{ display: 'inline-block', marginLeft: '10px' }}
              >
                <input type="hidden" name="id" value={client.id} />
                <button type="submit" disabled={isDeleting}>
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </Form>
            </li>
          );
        })}
      </ul>
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
