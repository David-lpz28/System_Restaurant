import { Link, Form, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useEffect, useState } from "react";

type Restaurant = {
  id: string;
  name: string;
  phone: string | null;
  address: string;
};

type LoaderData = {
  restaurants: Restaurant[];
  successMessage?: string;
  errorMessage?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });

  const url = new URL(request.url);
  const successMessage = url.searchParams.get("success") || null;
  const errorMessage = url.searchParams.get("error") || null;

  return json<LoaderData>({ restaurants, successMessage, errorMessage });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const restaurantId = formData.get("id");

  if (typeof restaurantId !== "string") {
    return redirect("/restaurants?error=Invalid restaurant ID.");
  }

  try {
    await prisma.item.deleteMany({
      where: { order: { restaurantId } },
    });
    await prisma.order.deleteMany({
      where: { restaurantId },
    });

    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    return redirect("/restaurants?success=Restaurant successfully deleted.");
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return redirect("/restaurants?error=Failed to delete the restaurant.");
  }
};

export default function RestaurantsList() {
  const { restaurants, successMessage, errorMessage } =
    useLoaderData<LoaderData>();
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
      <h1>Restaurants</h1>
      {displayError && <p style={{ color: "red" }}>{displayError}</p>}
      {displaySuccess && <p style={{ color: "green" }}>{displaySuccess}</p>}

      {/* Button to add a new restaurant */}
      <div style={{ marginBottom: "20px" }}>
        <Link to="/restaurants/new">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add New Restaurant
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
          {restaurants.map((restaurant) => {
            const isDeleting =
              navigation.formData?.get("id") === restaurant.id &&
              navigation.state === "submitting";

            return (
              <tr key={restaurant.id}>
                <td>{restaurant.name}</td>
                <td>{restaurant.phone}</td>
                <td>{restaurant.address}</td>
                <td>
                  <Link to={`/restaurants/edit/${restaurant.id}`}>
                    <button>Edit</button>
                  </Link>
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Are you sure you want to delete ${restaurant.name}?`
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={restaurant.id} />
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
