import { useDarkMode } from "./context/DarkModeContext"; // 👈 import hook
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./configs/firebase";
import { onSnapshot, getDoc, doc, setDoc } from "firebase/firestore";
import Navbar from "./components/Navbar";
import Waiting from "./components/pages/Waiting";
import AdminRoute from "./routes/AdminRoute";
import MaintenanceBanner from "./configs/MaintenanceBanner";
import Loading from "./components/pages/Loading";
import Blocked from "./components/pages/Blocked";
import PaymentFloatingLink from "./components/PaymentFloatingLink";
import { Routes, Route, useLocation } from "react-router-dom";
import MagicChessGoGo from "./components/RechargeComponents/RechargePages/MagicChessGoGo";

import Home from "./components/pages/Home";
import AccountDetails from "./components/BrowseComponents/MlbbAuctionOrderPage/AccountDetails";
import Games from "./components/pages/Games";
import FlappyBirdGame from "./components/GameComponents/FlappyBirdGame";
import { UserProvider } from "./context/UserContext";
import Recharge from "./components/pages/Recharge";
import LoginWithPhoneOTP from "./components/pages/LoginWithPhoneOTP";
import SignupWithOTP from "./components/pages/SignupWithOTP";
import ConfirmPayment from "./components/pages/ConfirmPayment";
import PaymentPage from "./components/pages/PaymentPage";
import Orders from "./components/pages/Orders";
import Wallet from "./components/pages/Wallet";
import Shortcut from "./components/Shortcut";
import Admin from "./components/pages/Admin";
import Maintenance from "./configs/Maintenance";
import Browse from "./components/pages/Browse";
import UserProfile from "./components/pages/UserProfile";
import AccountAuction from "./components/pages/AccountAuction";
import Redeem from "./components/pages/Redeem";
import Blogs from "./components/pages/Blogs";
import Charisma from "./components/RechargeComponents/RechargePages/Charisma";
import Subscription from "./components/pages/Subscription";
import Honkai from "./components/RechargeComponents/RechargePages/Honkai";
import MGlobal from "./components/RechargeComponents/RechargePages/MGlobal";
import Leaderboards from "./components/pages/Leaderboards";
import SkinGifting from "./components/RechargeComponents/RechargePages/SkinGifting";
import { useUser } from "./context/UserContext";
import Messages from "./components/pages/Messages";
import MLBBInternational from "./components/RechargeComponents/RechargePages/MLBBInternational";
import History from "./components/pages/History";
import IDChecker from "./components/BrowseComponents/IDChecker/IDChecker";
import ComingSoon from "./components/pages/ComingSoon";
import Genshin from "./components/RechargeComponents/RechargePages/Genshin";
import Collab from "./components/BrowseComponents/Collage/Collab";
import CollageHistory from "./components/BrowseComponents/Collage/CollageHistory";
import Zenless from "./components/RechargeComponents/RechargePages/Zenless";
import PubgGlobal from "./components/RechargeComponents/RechargePages/PubgGlobal";
import SuperSus from "./components/RechargeComponents/RechargePages/SuperSus";
import MLBBCustom from "./components/RechargeComponents/RechargePages/MLBBCustom";
import LoginWithEmail from "./components/pages/LoginWithEmail";
import GiftCard from "./components/pages/GiftCard";
import Wuthering from "./components/RechargeComponents/RechargePages/Wuthering";
import BloodStrike from "./components/RechargeComponents/RechargePages/BloodStrike";
import YCCallback from "./components/pages/YCCallback";
import HonorKings from "./components/RechargeComponents/RechargePages/HonorKings";
import WhereWindsMeet from "./components/RechargeComponents/RechargePages/WhereWIndsMeet";
import Api from "./components/pages/Api";
import RequireAdmin from "./utils/RequireAdmin";
import ApiProducts from "./components/ApiComponents/ApiProducts";
import ApiDocs from "./components/ApiComponents/ApiDocs";
import ApiProfile from "./components/ApiComponents/ApiProfile";
import ApiOrders from "./components/ApiComponents/ApiOrders";
import ApiAdminDashboard from "./components/ApiComponents/ApiAdminDashboard";
import ApiSubscription from "./components/ApiComponents/ApiSubscription";

const AppContent = () => {
  const location = useLocation();
  const { isAdmin } = useUser();
  const { isDarkMode } = useDarkMode();
  const noNavPaths = ["/games", "/games/flappy-bird"];
  const noShortcutPaths = [
    "/games",
    "/games/flappy-bird",
    "/collage",
    "/leaderboards",
  ];
  const hideNav = noNavPaths.includes(location.pathname);
  const hideShortcut = noShortcutPaths.includes(location.pathname);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const docSnap = await getDoc(doc(db, "config", "siteStatus"));
      const data = docSnap.data();
      if (!data) return setLoading(false);

      const now = Date.now();
      if (
        data.isMaintenanceScheduled &&
        now >= data.maintenanceStartTime &&
        !data.isMaintenance
      ) {
        await setDoc(
          doc(db, "config", "siteStatus"),
          { isMaintenance: true },
          { merge: true }
        );
      }

      setIsMaintenance(!!data.isMaintenance);
      setLoading(false);

      onSnapshot(doc(db, "config", "siteStatus"), (snap) => {
        const live = snap.data();
        if (live?.isMaintenance !== isMaintenance)
          setIsMaintenance(!!live.isMaintenance);
      });
    };

    checkStatus();
  }, [isMaintenance]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return setUserChecked(true);

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsBlocked(!!data.isBlocked);
      }

      setUserChecked(true);

      onSnapshot(userRef, (snap) => {
        const updated = snap.data();
        setIsBlocked(!!updated?.isBlocked);
      });
    });

    return () => unsubAuth();
  }, []);

  if (loading || !userChecked) return <Loading />;
  if (isBlocked) return <Blocked />;
  if (isMaintenance && !isAdmin) {
    return (
      <UserProvider>
        <Maintenance />
      </UserProvider>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-blue-50 text-gray-900"
      }`}
    >
      {!hideNav && <Navbar />}
      <div className={hideNav ? "" : "block h-12"}></div>
      {!hideNav && <MaintenanceBanner />}
      <PaymentFloatingLink />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/giftcard" element={<GiftCard />} />
        <Route path="/collage" element={<Collab />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route
          path="/games"
          element={
            <>
              <Games />
              <Shortcut />
            </>
          }
        />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/message" element={<Messages />} />
        <Route path="/games/flappy-bird" element={<FlappyBirdGame />} />
        <Route path="/ml-acc/:id" element={<AccountDetails />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/mlbb-skin-gift" element={<SkinGifting />} />
        <Route path="/mlbb-global" element={<MGlobal />} />
        <Route path="/charisma" element={<Charisma />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/account-auction" element={<AccountAuction />} />
        <Route path="/mcgg-recharge" element={<MagicChessGoGo />} />
        <Route path="/honkai-starrail" element={<Honkai />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/mlbb-international" element={<MLBBInternational />} />
        <Route path="/genshin-impact" element={<Genshin />} />
        <Route path="/mlbb-custom" element={<MLBBCustom />} />
        <Route path="/zzz" element={<Zenless />} />
        <Route path="/pubg-global" element={<PubgGlobal />} />
        <Route path="/super-sus" element={<SuperSus />} />
        <Route path="/recharge" element={<Recharge />} />
        <Route
          path="/login"
          element={<LoginWithEmail isDarkMode={isDarkMode} />}
        />
        <Route path="/redeem" element={<Redeem />} />
        <Route path="/sign-up" element={<SignupWithOTP />} />
        <Route path="/orders" element={<Orders />} />
        <Route
          path="/authentication-selection"
          element={<LoginWithPhoneOTP />}
        />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/id-checker" element={<IDChecker />} />
        <Route path="/payment-status/:order_id" element={<ConfirmPayment />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
        <Route path="/check-history/:userId" element={<History />} />
        <Route path="/collage-history" element={<CollageHistory />} />
        <Route path="/wuthering-waves" element={<Wuthering />} />
        <Route path="/blood-strike" element={<BloodStrike />} />
        <Route path="/honor-of-kings" element={<HonorKings />} />
        <Route path="/where-winds-meet" element={<WhereWindsMeet />} />
        <Route path="/yokcash/callback" element={<YCCallback />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/api"
          element={
            <RequireAdmin>
              <Api />
            </RequireAdmin>
          }
        />
        <Route
          path="/api/products"
          element={
            <RequireAdmin>
              <ApiProducts />
            </RequireAdmin>
          }
        />
        <Route
          path="/api/docs"
          element={
            <RequireAdmin>
              <ApiDocs />
            </RequireAdmin>
          }
        />
        <Route
          path="/api/profile"
          element={
            <RequireAdmin>
              <ApiProfile />
            </RequireAdmin>
          }
        />
        <Route
          path="/api/orders"
          element={
            <RequireAdmin>
              <ApiOrders />
            </RequireAdmin>
          }
        />
        <Route
          path="/api/subscriptions"
          element={
            <RequireAdmin>
              <ApiSubscription />
            </RequireAdmin>
          }
        />
        <Route
          path="/api/admin"
          element={
            <RequireAdmin>
              <ApiAdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
      <div className={hideShortcut ? "" : "block h-13"}></div>
      {!hideShortcut && <Shortcut />}
    </div>
  );
};
export default AppContent;
