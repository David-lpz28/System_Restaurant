import { Link, Form, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";

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

// Loader
export const loader: LoaderFunction = async () => {
  const clients = await prisma.client.findMany({ orderBy: { firstName: "asc" } });
  return json<LoaderData>({ clients });
};

// Action to handle deletion
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const clientId = formData.get("id");

  if (typeof clientId !== "string") {
    return json({ errorMessage: "Invalid client ID." }, { status: 400 });
  }

  try {
    await prisma.order.deleteMany({ where: { clientId } });
    await prisma.client.delete({ where: { id: clientId } });

    return redirect("/clients?success=Client deleted successfully.");
  } catch (error) {
    console.error("Error deleting client:", error);
    return json(
      { errorMessage: "Could not delete the client. Try again later." },
      { status: 500 }
    );
  }
};

// Component
export default function ClientsList() {
  const { clients, successMessage, errorMessage } = useLoaderData<LoaderData>();
  const navigation = useNavigation();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Clients</h1>
      {successMessage && (
        <div className="bg-green-100 text-green-800 p-2 rounded mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 text-red-800 p-2 rounded mb-4">
          {errorMessage}
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <Link to="/">
          <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
            Back to Home
          </button>
        </Link>
        <Link to="/clients/new">
          <button className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded">
            Add New Client
          </button>
        </Link>
      </div>
      <table className="table-auto w-full border-collapse border border-gray-300 shadow-lg">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-300 px-4 py-2">First Name</th>
            <th className="border border-gray-300 px-4 py-2">Last Name</th>
            <th className="border border-gray-300 px-4 py-2">Phone</th>
            <th className="border border-gray-300 px-4 py-2">Address</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const isDeleting =
              navigation.formData?.get("id") === client.id &&
              navigation.state === "submitting";

            return (
              <tr key={client.id} className="odd:bg-gray-50 even:bg-gray-100">
                <td className="border border-gray-300 px-4 py-2 text-gray-700">
                  {client.firstName}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-700">
                  {client.lastName}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-700">
                  {client.phone || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-700">
                  {client.address}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <Link to={`/clients/edit/${client.id}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded mr-2">
                      Edit
                    </button>
                  </Link>
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (!confirm(`Are you sure you want to delete ${client.firstName}?`)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={client.id} />
                    <button
                      type="submit"
                      className={`px-3 py-1 rounded ${
                        isDeleting
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                      disabled={isDeleting}
                    >
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
