import React, { useEffect, useState } from "react";
import UploadAssets from "./UploadAssets";
import UploadSkins from "./UploadSkins";
import { db } from "../../configs/firebase";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Check, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { motion } from "framer-motion";
import useModal from "../../context/useModal";
import { useUser } from "../../context/UserContext";

const CollageAdmin = () => {
  const [activeTab, setActiveTab] = useState("skins");
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skinsCount, setSkinsCount] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);
  const { user } = useUser();
  const { showConfirm, ModalComponent } = useModal();
  const isAdmin = user?.role === "admin";
  const [editModal, setEditModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  // ✅ Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  
  // ✅ Fetch skins & assets count
  useEffect(() => {
    if (!isAdmin) return;

    const unsubSkins = onSnapshot(collection(db, "skins"), (snapshot) => {
      setSkinsCount(snapshot.size);
    });

    const unsubAssets = onSnapshot(collection(db, "assets"), (snapshot) => {
      setAssetsCount(snapshot.size);
    });

    return () => {
      unsubSkins();
      unsubAssets();
    };
  }, [isAdmin]);
  // fetch images
  useEffect(() => {
    if (!activeTab || !isAdmin) return;
    const q = query(collection(db, activeTab));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (activeTab === "skins") {
        list = list.sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
      }

      setImages(list);
    });

    return () => unsubscribe();
  }, [activeTab, isAdmin]);

  const handleDelete = async (id) => {
    const confirm = await showConfirm("Confirm Action", "Are you sure?");
    if (confirm) {
      await deleteDoc(doc(db, activeTab, id));
    }
  };

  const handleEdit = (img) => {
    setCurrentImage(img);
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!currentImage) return;
    const ref = doc(db, activeTab, currentImage.id);

    if (activeTab === "skins") {
      await updateDoc(ref, {
        name: currentImage.name,
        hero: currentImage.hero,
        family: currentImage.family || "",
        points: String(currentImage.points),
        role: currentImage.role,
      });
    } else if (activeTab === "assets") {
      await updateDoc(ref, {
        name: currentImage.name,
        assetType: currentImage.assetType,
      });
    }

    setEditModal(false);
  };

  const filteredImages =
    activeTab === "skins"
      ? images.filter(
          (img) =>
            (img.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (img.hero || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      : images;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <h1 className="text-2xl font-bold">🚫 No Access</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      {/* Toggle Skins / Assets */}
    {/* ✅ Skins & Assets counts */}
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">
        Total Skins: {skinsCount}
      </h2>
      <h2 className="text-lg font-semibold">
        Total Assets: {assetsCount}
      </h2>
    </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <Button
            variant={activeTab === "skins" ? "default" : "outline"}
            onClick={() => setActiveTab("skins")}
          >
            Skins
          </Button>
          <Button
            variant={activeTab === "assets" ? "default" : "outline"}
            onClick={() => setActiveTab("assets")}
          >
            Assets
          </Button>
        </div>

        {/* ✅ Upload button opens modal */}
        <Button
          variant="default"
          onClick={() => setUploadModalOpen(true)}
        >
          Upload
        </Button>
      </div>

      {/* ✅ Conditionally render modal */}
      {activeTab === "skins" ? (
        <UploadSkins
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
        />
      ) : (
        <UploadAssets
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
        />
      )}

      {/* Search bar for skins only */}
      {activeTab === "skins" && (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="p-2 rounded bg-slate-800 text-white w-full"
            placeholder="Search by name or hero..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button className="bg-blue-600">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredImages.map((img) => (
          <motion.div key={img.id} className="relative">
            <Card className="bg-slate-900 shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={img.imageUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-[10px]">
                    {img.name || "Unnamed"}
                  </h3>
                  {activeTab === "skins" ? (
                    <>
                      <p className="text-[10px] text-gray-400">
                        Points: {img.points || 0}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Role: {img.role || "none"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Family: {img.family || "none"}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-gray-400">
                      Type: {img.assetType || "none"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="sm"
                className="bg-blue-600"
                onClick={() => handleEdit(img)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                className="bg-red-600"
                onClick={() => handleDelete(img.id)}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      {editModal && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto">
          <div className="relative w-full max-w-md p-6 my-10 bg-slate-900 rounded-2xl shadow-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {activeTab === "skins" ? "Edit Skin" : "Edit Asset"}
            </h2>

            <div className="flex flex-col gap-3">
              {/* Name field */}
              <input
                type="text"
                className="p-2 rounded bg-slate-800"
                placeholder="Name"
                value={currentImage.name || ""}
                onChange={(e) =>
                  setCurrentImage({ ...currentImage, name: e.target.value })
                }
              />

              {activeTab === "skins" ? (
                <>
                  <input
                    type="text"
                    className="p-2 rounded bg-slate-800"
                    placeholder="Hero Name"
                    value={currentImage.hero || ""}
                    onChange={(e) =>
                      setCurrentImage({ ...currentImage, hero: e.target.value })
                    }
                  />

                  <select
                    className="p-2 rounded bg-slate-800"
                    value={currentImage.points || ""}
                    onChange={(e) =>
                      setCurrentImage({
                        ...currentImage,
                        points: e.target.value,
                      })
                    }
                  >
                    {["4000", "3000", "2000", "1000", "400", "200", "40"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  {/* Family */}
                  <div className="max-h-40 p-2 overflow-y-auto bg-slate-800 flex flex-col gap-2 rounded">
                    {[
  "11.11",
  "515",
  "Abyss",
  "All Star",
  "Anniversary",
  "AOT",
  "Aspirant",
  "Atomic pop",
  "Blazing",
  "Champions",
  "Chrismas",
  "Clouds",
  "Collector",
  "Covenant",
  "Create",
  "Dawning",
  "Dino",
  "Dragon tamer",
  "Ducati",
  "Elite",
  "Epic",
  "Exorcist",
  "Finals MVP",
  "Golden Month",
  "Golden Starlight",
  "Halloween",
  "HxH",
  "JJK",
  "Kishin",
  "KOF",
  "Kung Fu Panda",
  "Legends",
  "Lightborn",
  "Limited skins",
  "Luckybox",
  "Lunarfest",
  "M Series",
  "M World",
  "MCGG skins",
  "Meow",
  "Mist Benders",
  "MPL Skins",
  "MSC Skins",
  "Myth Skins",
  "Naruto",
  "Neobeast",
  "Neymar",
  "Normal Skins",
  "Pacquiao Licensed Skin",
  "Prime",
  "Rising",
  "S.A.B.E.R",
  "Saint Saiya",
  "Sanrio",
  "Season Skins",
  "Soul Vessel",
  "Sparkle",
  "Special",
  "Star wars",
  "Starlight Skins",
  "Stun",
  "Summer",
  "Transformer",
  "Valentines",
  "Venom",
  "Zenith",
  "Zodiac",
].map((fam) => {
                      const isSelected = currentImage.family === fam;
                      return (
                        <div
                          key={fam}
                          className={`cursor-pointer p-2 rounded flex items-center justify-between 
                            ${isSelected ? "bg-blue-600 text-white font-semibold" : "bg-slate-600 hover:bg-slate-700"}`}
                          onClick={() => setCurrentImage({ ...currentImage, family: fam })}
                        >
                          <span>{fam}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>

                  <select
                    className="p-2 rounded bg-slate-800"
                    value={currentImage.role || ""}
                    onChange={(e) =>
                      setCurrentImage({
                        ...currentImage,
                        role: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Role</option>
                    <option value="mage">Mage</option>
                    <option value="fighter">Fighter</option>
                    <option value="tank">Tank</option>
                    <option value="marksman">Marksman</option>
                    <option value="support">Support</option>
                    <option value="assassin">Assassin</option>
                  </select>
                </>
              ) : (
                <select
                  className="p-2 rounded bg-slate-800"
                  value={currentImage.assetType || ""}
                  onChange={(e) =>
                    setCurrentImage({
                      ...currentImage,
                      assetType: e.target.value,
                    })
                  }
                >
                  <option value="">Select Asset Type</option>
                  {["emote", "recall", "notification", "chatbox", "elimination"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-slate-900 py-2">
              <Button variant="outline" onClick={() => setEditModal(false)}>
                Cancel
              </Button>
              <Button className="bg-green-600" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {ModalComponent}
    </div>
  );
};

export default CollageAdmin;
