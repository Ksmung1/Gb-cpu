import HomeDisplay from "../HomeComponents/HomeDisplay";
import HomeMenu from "../HomeComponents/HomeMenu";
import HomeFooter from "../HomeComponents/HomeFooter";
import HomeShortcuts from "../HomeComponents/HomeShortcuts";
import HomeSearch from "../HomeComponents/HomeSearch";
const Home = () => {
  return (
    <div>
      <div className="px-4 mt-3 md:px-20 lg:px-40 flex flex-col items-center max-w-screen-xl mx-auto">
        <HomeSearch/>
        <HomeDisplay />
        <HomeShortcuts/>
        <HomeMenu />
      </div>
      <HomeFooter />
    </div>
  );
};

export default Home;
