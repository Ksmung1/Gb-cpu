import { FaWhatsapp, FaUserCircle } from "react-icons/fa";

const ContactDeveloper = () => {
  return (
          <>
             <a
          href="https://wa.me/916009099196" // Replace with your number
          target="_blank"
          rel="noopener noreferrer"
          className="items-center gap-2 hover:underline mt-1 text-sm"
        >
    <div className="flex items-center space-x-3 p-2 border rounded shadow mt-5">
      <FaUserCircle className="text-3xl text-gray-600" />

      <div className="flex">
        <p className="font-semibold">Contact Website Developer</p>
     
       
      </div>
    </div>
     </a>
     </>
  );
};

export default ContactDeveloper;
