import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div>
      <h1>Bienvenido a la Aplicación</h1>
      <Link to="/clients">
        <button>Ir a la Lista de Clientes</button>
      </Link>
      <Link to="/restaurants" style={{ marginLeft: "10px" }}>
        <button>Ir a la Lista de Restaurantes</button>
      </Link>
    </div>
  );
}
