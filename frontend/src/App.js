import { jsx as _jsx } from "react/jsx-runtime";
import { AppProviders } from "./app/AppProviders";
import { AppRouter } from "./app/AppRouter";
function App() {
    return (_jsx(AppProviders, { children: _jsx(AppRouter, {}) }));
}
export default App;
