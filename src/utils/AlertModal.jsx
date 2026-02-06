import { useModal } from "../context/ModalContext";

const AlertModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
          <h2 className="text-xl font-bold text-white text-center">Gamebar Official</h2>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-indigo-500 text-white font-semibold shadow hover:bg-indigo-600 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
