import { Link, useLoaderData, Form, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useEffect, useState } from "react";
import { getSession, commitSession } from "../../../sessions.server";

// Define the client data type
type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
};

// Define the loader data type
type LoaderData = {
  clients: Client[];
  successMessage?: string;
  errorMessage?: string;
};

// Loader to fetch the list of clients and flash messages
export const loader: LoaderFunction = async ({ request }) => {
  const clients: Client[] = await prisma.client.findMany({
    orderBy: { firstName: "asc" },
  });

  const session = await getSession(request.headers.get("Cookie"));
  const successMessage = session.get("success");
  const errorMessage = session.get("error");

  return json<LoaderData>(
    { clients, successMessage, errorMessage },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

// Action to handle client deletion
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const clientId = formData.get("id");

  if (typeof clientId !== "string") {
    const session = await getSession(request.headers.get("Cookie"));
    session.flash("error", "Invalid client ID.");
    return redirect("/clients", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  try {
    await prisma.client.delete({
      where: { id: clientId },
    });
    const session = await getSession(request.headers.get("Cookie"));
    session.flash("success", "Client successfully deleted.");
    return redirect("/clients", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error("Error deleting the client:", error);
    const session = await getSession(request.headers.get("Cookie"));
    session.flash("error", "Could not delete the client.");
    return redirect("/clients", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
};

export default function ClientsList() {
  const { clients, successMessage, errorMessage } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const [displaySuccess, setDisplaySuccess] = useState<string | null>(
    successMessage || null
  );
  const [displayError, setDisplayError] = useState<string | null>(
    errorMessage || null
  );

  useEffect(() => {
    if (successMessage) {
      setDisplaySuccess(successMessage);
      // Clear the message after displaying it
      setTimeout(() => {
        setDisplaySuccess(null);
      }, 5000);
    }

    if (errorMessage) {
      setDisplayError(errorMessage);
      // Clear the message after displaying it
      setTimeout(() => {
        setDisplayError(null);
      }, 5000);
    }
  }, [successMessage, errorMessage]);

  return (
    <div>
      <h1>Client List</h1>
      {displaySuccess && <p style={{ color: "green" }}>{displaySuccess}</p>}
      {displayError && <p style={{ color: "red" }}>{displayError}</p>}
      <Link to="/clients/new">
        <button>Create New Client</button>
      </Link>
      <ul>
        {clients.map((client) => {
          const isDeleting =
            navigation.formData?.get("id") === client.id &&
            navigation.state === "submitting";

          return (
            <li key={client.id} style={{ marginTop: "10px" }}>
              <span>
                {client.firstName} {client.lastName} - {client.phoneNumber} -{" "}
                {client.address}
              </span>
              <Link
                to={`/clients/edit/${client.id}`}
                style={{ marginLeft: "10px" }}
              >
                <button>Edit</button>
              </Link>
              <Form
                method="post"
                onSubmit={(event) => {
                  if (
                    !confirm(
                      `Are you sure you want to delete ${client.firstName} ${client.lastName}?`
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
                style={{ display: "inline-block", marginLeft: "10px" }}
              >
                <input type="hidden" name="id" value={client.id} />
                <button type="submit" disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </Form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Error Boundary to handle errors in this route
import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

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
        <h1>An unexpected error occurred</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === "development" && <pre>{error.stack}</pre>}
      </div>
    );
  } else {
    return <h1>Unknown error</h1>;
  }
}
