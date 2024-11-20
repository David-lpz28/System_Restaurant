
import { LoaderFunction, ActionFunction, redirect } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { prisma } from '~/db.server';

// Loader para obtener la lista de clientes
export const loader: LoaderFunction = async () => {
  const clients = await prisma.client.findMany();
  return { clients };
};

// Action para manejar la creación de un nuevo cliente
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const first_name = formData.get('first_name') as string;
  const last_name = formData.get('last_name') as string;
  const phone_number = formData.get('phone_number') as string;
  const address = formData.get('address') as string;

  // Validación básica
  if (!first_name || !last_name || !phone_number || !address) {
    return { error: 'Todos los campos son obligatorios' };
  }

  // Crear el nuevo cliente en la base de datos
  await prisma.client.create({
    data: {
      first_name,
      last_name,
      phone_number,
      address,
    },
  });

  // Redireccionar a la misma página para ver el nuevo cliente en la lista
  return redirect('/clients');
};

// Componente principal para mostrar y crear clientes
export default function Clients() {
  const { clients } = useLoaderData();

  return (
    <div>
      <h1>Lista de Clientes</h1>
      <ul>
        {clients.map((client: any) => (
          <li key={client.id}>
            {client.first_name} {client.last_name} - {client.phone_number}
          </li>
        ))}
      </ul>

      <h2>Agregar Nuevo Cliente</h2>
      <Form method="post">
        <div>
          <label>
            Nombre:
            <input type="text" name="first_name" required />
          </label>
        </div>
        <div>
          <label>
            Apellido:
            <input type="text" name="last_name" required />
          </label>
        </div>
        <div>
          <label>
            Teléfono:
            <input type="text" name="phone_number" required />
          </label>
        </div>
        <div>
          <label>
            Dirección:
            <input type="text" name="address" required />
          </label>
        </div>
        <button type="submit">Agregar Cliente</button>
      </Form>
    </div>
  );
}
