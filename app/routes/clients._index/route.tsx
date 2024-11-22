import { useState } from "react";
import { Link, Form, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";

// Define client data type
type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string;
};

// Define loader data type
type LoaderData = {
  clients: Client[];
  successMessage?: string;
  errorMessage?: string;
};

// Loader to fetch clients
export const loader: LoaderFunction = async () => {
  const clients = await prisma.client.findMany({
    orderBy: { firstName: "asc" },
  });
  return json<LoaderData>({ clients });
};

// Action to handle client deletion
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const clientId = formData.get("id");

  if (typeof clientId !== "string") {
    return json({ errorMessage: "Invalid client ID." }, { status: 400 });
  }

  try {
    // Cascade delete associated orders and items
    await prisma.order.deleteMany({
      where: { clientId },
    });
    await prisma.client.delete({
      where: { id: clientId },
    });

    return redirect("/clients?success=Client deleted successfully.");
  } catch (error) {
    console.error("Error deleting client:", error);
    return json(
      { errorMessage: "Could not delete the client. Try again later." },
      { status: 500 }
    );
  }
};

export default function ClientsList() {
  const { clients: initialClients, successMessage, errorMessage } =
    useLoaderData<LoaderData>();
  const [clients, setClients] = useState(initialClients);
  const navigation = useNavigation();

  const handleDelete = (id: string) => {
    setClients((prevClients) =>
      prevClients.filter((client) => client.id !== id)
    );
  };

  return (
    <div>
      <h1>Clients</h1>
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      <div style={{ marginBottom: "20px" }}>
        <Link to="/clients/new">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add New Client
          </button>
        </Link>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const isDeleting =
              navigation.formData?.get("id") === client.id &&
              navigation.state === "submitting";

            return (
              <tr key={client.id}>
                <td>
                  {client.firstName} {client.lastName}
                </td>
                <td>{client.phone}</td>
                <td>{client.address}</td>
                <td>
                  <Link to={`/clients/edit/${client.id}`}>
                    <button>Edit</button>
                  </Link>
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Are you sure you want to delete ${client.firstName} ${client.lastName}? This action will also delete all orders and associated items for this client.`
                        )
                      ) {
                        e.preventDefault();
                        return;
                      }
                      handleDelete(client.id); // Optimistically update the UI
                    }}
                  >
                    <input type="hidden" name="id" value={client.id} />
                    <button type="submit" disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </Form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
