const HomeDisplay = () => {
  return (
    <div className="w-full md:max-w-md px-0 max-w-sm lg:max-w-xl mx-auto mt-2 flex justify-center items-center">
      <div className="rounded-md mx-auto w-full overflow-hidden shadow-lg">
        <img
          src="/gamebar-display.avif"
          alt="Display"
          loading="eager"
          className="w-full max-w-full h-auto max-h-36 md:max-h-[200px] lg:max-h-60 transition-transform duration-500 ease-in-out transform"
        />
      </div>
    </div>
  );
};

export default HomeDisplay;
