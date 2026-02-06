// src/components/Providers.jsx
import React from 'react';
import { ProductProvider } from './context/ProductContext';
import { UserProvider } from './context/UserContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { ModalProvider } from './context/ModalContext';
import { UserIDProvider } from './context/UserIDContext';
import { AlertProvider } from './context/AlertContext';

const Providers = ({ children }) => (
  <ProductProvider>
    <UserProvider>
      <DarkModeProvider>
        <ModalProvider>
          <UserIDProvider>
            <AlertProvider>{children}</AlertProvider>
          </UserIDProvider>
        </ModalProvider>
      </DarkModeProvider>
    </UserProvider>
  </ProductProvider>
);

export default Providers;
