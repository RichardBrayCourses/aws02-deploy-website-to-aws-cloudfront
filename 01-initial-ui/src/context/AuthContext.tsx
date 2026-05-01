import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";

/////////////
// USER TYPE
/////////////

export type AuthenticatedUser = {
  isLoggedIn: boolean;
  email: string | null;
};

////////////////////////////////////
// LOGGED IN / LOGGED OUT CONSTANTS
////////////////////////////////////

const LOGGED_IN_USER = {
  isLoggedIn: true,
  email: "demo@example.com",
};

const LOGGED_OUT_USER = {
  isLoggedIn: false,
  email: null,
};

/////////////
// CONTEXT
/////////////

interface AuthContextData {
  user: AuthenticatedUser;
}
interface AuthContextValue extends AuthContextData {
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/////////////
// HELPER
/////////////

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within <AuthProvider>");
  return value;
}

////////////////////////
// LOAD / SAVE CONTEXT
////////////////////////

function saveContext(contextData: AuthContextData) {
  localStorage.setItem("user", JSON.stringify(contextData.user));
}

function loadContext(): AuthContextData {
  const storedData = localStorage.getItem("user");

  if (storedData === null) {
    return { user: LOGGED_OUT_USER };
  } else {
    return { user: JSON.parse(storedData) as AuthenticatedUser };
  }
}

/////////////
// PROVIDER
/////////////

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState(loadContext().user);

  useEffect(() => {
    saveContext({ user });
  }, [user]);

  const login = () => setUser(LOGGED_IN_USER);
  const logout = () => setUser(LOGGED_OUT_USER);

  const sharedData = { user, login, logout };

  return (
    <AuthContext.Provider value={sharedData}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
