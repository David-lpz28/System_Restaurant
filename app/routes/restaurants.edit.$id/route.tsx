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
    <div className="p-8 max-w-3xl mx-auto bg-gray-100 rounded-lg shadow-lg">
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Edit Restaurant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the restaurant details below.
        </p>
      </header>

      {/* Display form error message */}
      {actionData?.formError && (
        <p className="text-red-600 font-semibold mb-4">
          {actionData.formError}
        </p>
      )}

      {/* Edit Form */}
      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Name:</label>
          <input
            type="text"
            name="name"
            defaultValue={restaurant.name}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Phone Number:
          </label>
          <input
            type="tel"
            name="phone"
            defaultValue={restaurant.phone}
            required
            pattern="^\+?[1-9]\d{1,14}$"
            title="Please enter a valid phone number."
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Address:</label>
          <input
            type="text"
            name="address"
            defaultValue={restaurant.address}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 font-medium text-white rounded-md shadow-md ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Updating..." : "Update Restaurant"}
          </button>
          <Link to="/restaurants">
            <button className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md shadow-md">
              Back to Restaurant List
            </button>
          </Link>
        </div>
      </Form>
    </div>
  );
}

// Error Boundary to handle errors in this route
import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error {error.status}</h1>
        <p className="text-gray-700 mt-2">{error.statusText}</p>
        {error.data && (
          <pre className="mt-4 text-gray-500">{JSON.stringify(error.data, null, 2)}</pre>
        )}
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">An unexpected error occurred</h1>
        <p className="text-gray-700 mt-2">{error.message}</p>
      </div>
    );
  } else {
    return <h1 className="text-2xl font-bold text-gray-700">Unknown error</h1>;
  }
}
