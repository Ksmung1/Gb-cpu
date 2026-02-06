import { useState } from "react";
import Modal from "../components/BrowseComponents/Collage/helper/Modal"

export default function useModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    actions: null,
  });

  const showAlert = (title, message) =>
    new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        actions: (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => {
              setModalState((prev) => ({ ...prev, isOpen: false }));
              resolve();
            }}
          >
            OK
          </button>
        ),
      });
    });

  const showConfirm = (title, message) =>
    new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        actions: (
          <>
            <button
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-400"
              onClick={() => {
                setModalState((prev) => ({ ...prev, isOpen: false }));
                resolve(false);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => {
                setModalState((prev) => ({ ...prev, isOpen: false }));
                resolve(true);
              }}
            >
              Confirm
            </button>
          </>
        ),
      });
    });

  const ModalComponent = (
    <Modal
      isOpen={modalState.isOpen}
      onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      title={modalState.title}
      message={modalState.message}
      actions={modalState.actions}
    />
  );

  return { showAlert, showConfirm, ModalComponent };
}
