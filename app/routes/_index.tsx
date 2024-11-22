import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div>
      <h1>Welcome to the Application</h1>
      <Link to="/clients">
        <button>View Clients</button>
      </Link>
      <Link to="/restaurants" style={{ marginLeft: "10px" }}>
        <button>View Restaurants</button>
      </Link>
      <Link to="/orders" style={{ marginLeft: "10px" }}>
        <button>View Orders</button>
      </Link>
    </div>
  );
}
