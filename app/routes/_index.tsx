import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div>
      <h1>Welcome to the Application</h1>
      <Link to="/clients">
        <button>Go to Client List</button>
      </Link>
      <Link to="/restaurants" style={{ marginLeft: "10px" }}>
        <button>Go to Restaurant List</button>
      </Link>
    </div>
  );
}
