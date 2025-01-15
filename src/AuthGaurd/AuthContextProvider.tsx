import {createContext, useContext, useEffect, useState} from "react";

const AuthContext = createContext({
    isAuthenticated: false,
    validateLogin: (token:string) => {},
    validateLogout: () => {}
});

export const AuthContextProvider = ({children}:any) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    const validateLogin = (token: string) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true)
    };
    const validateLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      };
    return(
        <AuthContext.Provider value={{isAuthenticated, validateLogin, validateLogout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);