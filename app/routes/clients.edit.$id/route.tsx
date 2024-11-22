import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  Link,
} from "@remix-run/react";
import { prisma } from "~/db.server";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// Define the client data type
type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

// Define the action data type
interface ActionData {
  formError?: string;
}

// Loader to fetch client data by ID
export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) {
    throw new Response("Client ID not provided", { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    throw new Response("Client not found", { status: 404 });
  }

  return json({ client });
};

// Action to handle form submission for editing
export const action: ActionFunction = async ({ request, params }) => {
  const { id } = params;
  if (!id) {
    return json({ formError: "Client ID not provided." }, { status: 400 });
  }

  const formData = await request.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phoneNumber = formData.get("phone");
  const address = formData.get("address");

  // Validate required fields
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof phoneNumber !== "string" ||
    typeof address !== "string" ||
    !firstName.trim() ||
    !lastName.trim() ||
    !phoneNumber.trim() ||
    !address.trim()
  ) {
    return json(
      { formError: "All fields are required." },
      { status: 400 }
    );
  }

  // Validate phone number format using libphonenumber-js
  const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, "US"); // Replace 'US' with your country code
  if (!phoneNumberParsed || !phoneNumberParsed.isValid()) {
    return json(
      { formError: "Invalid phone number format." },
      { status: 400 }
    );
  }

  // Format phone number to international format
  const formattedPhoneNumber = phoneNumberParsed.formatInternational();

  // Update client in the database
  try {
    await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone: formattedPhoneNumber,
        address,
      },
    });
    // Redirect to the client list with a success message
    return redirect("/clients?success=true");
  } catch (error) {
    console.error("Error updating client:", error);
    return json(
      { formError: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
};

export default function EditClient() {
  const { client } = useLoaderData<{ client: Client }>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1>Edit Client</h1>
      {actionData?.formError && (
        <p style={{ color: "red" }}>{actionData.formError}</p>
      )}
      <Form method="post">
        <div>
          <label>
            First Name:
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
            Last Name:
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
            Phone Number:
            <input
              type="tel"
              name="phone"
              defaultValue={client.phone}
              required
              pattern="^\+?[1-9]\d{1,14}$"
              title="Please enter a valid phone number."
            />
          </label>
        </div>
        <div>
          <label>
            Address:
            <input
              type="text"
              name="address"
              defaultValue={client.address}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Client"}
        </button>
      </Form>
      <Link to="/clients">
        <button>Back to Client List</button>
      </Link>
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
