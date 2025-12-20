import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Layout from "./Layout/Layout";
import Home from "./pages/Home";
import Main from "./pages/Main";
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/main",
          element: <Main />,
        },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
