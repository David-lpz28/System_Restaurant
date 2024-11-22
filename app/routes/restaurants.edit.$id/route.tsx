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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-8">Edit Restaurant</h1>

        {/* Error Message */}
        {actionData?.formError && (
          <p className="text-red-500 bg-gray-800 p-2 rounded text-center mb-4">
            {actionData.formError}
          </p>
        )}

        <Form method="post" className="bg-gray-800 p-6 rounded shadow-md">
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">Name:</label>
            <input
              type="text"
              name="name"
              defaultValue={restaurant.name}
              required
              className="w-full p-2 rounded bg-gray-700 text-gray-100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">Phone Number:</label>
            <input
              type="tel"
              name="phone"
              defaultValue={restaurant.phone}
              required
              pattern="^\+?[1-9]\d{1,14}$"
              title="Please enter a valid phone number."
              className="w-full p-2 rounded bg-gray-700 text-gray-100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">Address:</label>
            <input
              type="text"
              name="address"
              defaultValue={restaurant.address}
              required
              className="w-full p-2 rounded bg-gray-700 text-gray-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-gray-100 font-bold rounded"
          >
            {isSubmitting ? "Updating..." : "Update Restaurant"}
          </button>
        </Form>

        {/* Back to Restaurant List Button */}
        <div className="mt-6 text-center">
          <Link
            to="/restaurants"
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded font-medium"
          >
            Back to Restaurant List
          </Link>
        </div>
      </div>
    </div>
  );
}
