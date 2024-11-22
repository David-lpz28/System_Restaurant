import { Link, Form, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useEffect, useState } from "react";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string;
};

type LoaderData = {
  clients: Client[];
  successMessage?: string;
  errorMessage?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const clients = await prisma.client.findMany({
    orderBy: { firstName: "asc" },
  });

  const url = new URL(request.url);
  const successMessage = url.searchParams.get("success") || null;
  const errorMessage = url.searchParams.get("error") || null;

  return json<LoaderData>({ clients, successMessage, errorMessage });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const clientId = formData.get("id");

  if (typeof clientId !== "string") {
    return redirect("/clients?error=Invalid client ID.");
  }

  try {
    await prisma.item.deleteMany({
      where: { order: { clientId } },
    });
    await prisma.order.deleteMany({
      where: { clientId },
    });

    await prisma.client.delete({
      where: { id: clientId },
    });

    return redirect("/clients?success=Client successfully deleted.");
  } catch (error) {
    console.error("Error deleting client:", error);
    return redirect("/clients?error=Failed to delete the client.");
  }
};

export default function ClientsList() {
  const { clients, successMessage, errorMessage } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const [displayError, setDisplayError] = useState<string | null>(errorMessage);
  const [displaySuccess, setDisplaySuccess] = useState<string | null>(
    successMessage
  );

  useEffect(() => {
    if (errorMessage) {
      setDisplayError(errorMessage);
      setTimeout(() => setDisplayError(null), 5000);
    }
    if (successMessage) {
      setDisplaySuccess(successMessage);
      setTimeout(() => setDisplaySuccess(null), 5000);
    }
  }, [errorMessage, successMessage]);

  return (
    <div>
      <h1>Clients</h1>
      {displayError && <p style={{ color: "red" }}>{displayError}</p>}
      {displaySuccess && <p style={{ color: "green" }}>{displaySuccess}</p>}

      {/* Button to add a new client */}
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
                          `Are you sure you want to delete ${client.firstName} ${client.lastName}?`
                        )
                      ) {
                        e.preventDefault();
                      }
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
