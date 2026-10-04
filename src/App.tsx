import { Cursor, ScrollBar, SmoothScroll } from "./lib/shell";
import Nordlys from "./Nordlys";

export default function App() {
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <ScrollBar tone="#a9cfe0" />
      <Nordlys />
    </>
  );
}
