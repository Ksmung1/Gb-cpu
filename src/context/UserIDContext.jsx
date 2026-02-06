import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';

const UserIDContext = createContext();

export const UserIDProvider = ({ children }) => {
  const [usernameExists, setUsernameExists] = useState(false);



  return (
    <UserIDContext.Provider
      value={{
        usernameExists, setUsernameExists
      }}
    >
      {children}
    </UserIDContext.Provider>
  );
};

export const useUserID = () => useContext(UserIDContext);
