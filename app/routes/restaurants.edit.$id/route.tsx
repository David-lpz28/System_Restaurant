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

// Define the restaurant data type
type Restaurant = {
  id: string;
  name: string;
  phone: string;
  address: string;
};

// Define the action data type
interface ActionData {
  formError?: string;
}

// Loader to fetch restaurant data by ID
export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) {
    throw new Response("Restaurant ID not provided", { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) {
    throw new Response("Restaurant not found", { status: 404 });
  }

  return json({ restaurant });
};

// Action to handle form submission for editing
export const action: ActionFunction = async ({ request, params }) => {
  const { id } = params;
  if (!id) {
    return json({ formError: "Restaurant ID not provided." }, { status: 400 });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const phoneNumber = formData.get("phone");
  const address = formData.get("address");

  // Validate required fields
  if (
    typeof name !== "string" ||
    typeof phoneNumber !== "string" ||
    typeof address !== "string" ||
    !name.trim() ||
    !phoneNumber.trim() ||
    !address.trim()
  ) {
    return json(
      { formError: "All fields are required." },
      { status: 400 }
    );
  }

  // Validate phone number format using libphonenumber-js
  const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, "US");
  if (!phoneNumberParsed || !phoneNumberParsed.isValid()) {
    return json(
      { formError: "Invalid phone number format." },
      { status: 400 }
    );
  }

  // Format phone number to international format
  const formattedPhoneNumber = phoneNumberParsed.formatInternational();

  // Update restaurant in the database
  try {
    await prisma.restaurant.update({
      where: { id },
      data: {
        name,
        phone: formattedPhoneNumber,
        address,
      },
    });
    // Redirect to the restaurant list with a success message
    return redirect("/restaurants?success=true");
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return json(
      { formError: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
};

export default function EditRestaurant() {
  const { restaurant } = useLoaderData<{ restaurant: Restaurant }>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h1>Edit Restaurant</h1>
      {/* Display form error message */}
      {actionData?.formError && (
        <p style={{ color: "red" }}>{actionData.formError}</p>
      )}
      <Form method="post">
        <div>
          <label>
            Name:
            <input
              type="text"
              name="name"
              defaultValue={restaurant.name}
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
              defaultValue={restaurant.phone}
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
              defaultValue={restaurant.address}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Restaurant"}
        </button>
      </Form>
      {/* Back to the restaurant list */}
      <Link to="/restaurants">
        <button>Back to Restaurant List</button>
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
        {process.env.NODE_ENV === "development" && (
          <pre>{error.stack}</pre>
        )}
      </div>
    );
  } else {
    return <h1>Unknown error</h1>;
  }
}
