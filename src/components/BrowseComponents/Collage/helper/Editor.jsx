import React, { useState, forwardRef, useEffect, useRef } from "react";

const Collage = forwardRef(
  (
    {
      bgColor,
      border,
      accountImage,
      removeAccountImage,
      handleAccountImageUpload,
      displayedItems,
      allSkins,
      allAssets,
      selectedAssets,
      setSelectedAssets,
      cols,
      imageWidth,
      style,
      paid,
      accountSection
    },
    ref
  ) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [lastDistance, setLastDistance] = useState(null);
    const [touchStartY, setTouchStartY] = useState(null);
    const [isScrolling, setIsScrolling] = useState(false);

    const accountRef = useRef(null);

    // Utility
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updatePosition = (newX, newY) => {
      const container = accountRef?.current?.getBoundingClientRect?.();
      if (!container) return;

      const maxX = (container.width * scale - container.width) / 2;
      const maxY = (container.height * scale - container.height) / 2;

      setPosition({
        x: clamp(newX, -maxX, maxX),
        y: clamp(newY, -maxY, maxY),
      });
    };

    // Account Image Drag
    const handleMouseDown = (e) => {
      setDragging(true);
      setStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    const handleMouseMove = (e) => dragging && updatePosition(e.clientX - start.x, e.clientY - start.y);
    const handleMouseUp = () => setDragging(false);
    const handleWheel = (e) => {
      e.preventDefault();
      const newScale = Math.min(Math.max(0.5, scale + e.deltaY * -0.001), 3);
      setScale(newScale);
    };

    // Touch
    const getDistance = (touches) => {
      const [a, b] = touches;
      return Math.sqrt(Math.pow(a.clientX - b.clientX, 2) + Math.pow(a.clientY - b.clientY, 2));
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        setTouchStartY(e.touches[0].clientY);
        setDragging(true);
        setIsScrolling(false);
        setStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
      } else if (e.touches.length === 2) {
        setLastDistance(getDistance(e.touches));
        setIsScrolling(false);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && dragging) {
        const touchY = e.touches[0].clientY;
        const deltaY = Math.abs(touchY - touchStartY);
        const deltaX = Math.abs(e.touches[0].clientX - start.x - position.x);

        if (!isScrolling && deltaY > 10 && deltaY > deltaX * 1.5) {
          setIsScrolling(true);
          setDragging(false);
          return;
        }

        if (!isScrolling) {
          e.preventDefault();
          updatePosition(e.touches[0].clientX - start.x, e.touches[0].clientY - start.y);
        }
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const distance = getDistance(e.touches);
        if (lastDistance) {
          const diff = distance - lastDistance;
          setScale((prev) => Math.min(Math.max(0.5, prev + diff * 0.005), 3));
        }
        setLastDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      setDragging(false);
      setLastDistance(null);
      setTouchStartY(null);
      setIsScrolling(false);
    };

    // Passive touch warning fix
    useEffect(() => {
      const el = accountRef.current;
      if (!el) return;
      const handle = (e) => {
        if (!isScrolling) {
          e.preventDefault();
        }
      };
      el.addEventListener("touchmove", handle, { passive: false });
      return () => el.removeEventListener("touchmove", handle);
    }, [isScrolling]);

    return (
      <div className="flex justify-center items-start max-w-sm bg-transparent">
        <div ref={ref} className="inline-block" style={{ background: bgColor, boxSizing: "border-box" }}>
          <div className="relative">
            {accountSection ?       <div
              ref={accountRef}
              className="w-[360px] aspect-[16/8] flex justify-center items-center cursor-pointer bg-gray-900 overflow-hidden relative"
              onClick={() => !accountImage && document.getElementById("account-upload-input").click()}
              style={{ backgroundColor: bgColor, padding: `${border}px ${border}px 0 ${border}px`, touchAction: "none", boxSizing: "border-box" }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={(e) => handleTouchStart(e)}
              onTouchMove={(e) => handleTouchMove(e)}
              onTouchEnd={handleTouchEnd}
            >
              {!accountImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-4 border border-dotted">
                    <p className="select-none text-gray-200">Click to upload account image</p>
                    <small className="select-none text-gray-500">Recommended aspect ratio 16:9</small>
                  </div>
                  {selectedAssets.length > 0 && (
                    <div
                      style={{
                        gap: `${border}px`,
                        background: bgColor,
                        padding: `${border}px`,
                        maxWidth: `${360 - 2 * border}px`, // Constrain to fit within container
                      }}
                      className="absolute bottom-0 right-0 flex flex-row items-end"
                    >
                      {selectedAssets.map((itemId) => {
                        const item = allAssets.find((s) => s.id === itemId);
                        if (!item) return null;
                        return (
                          <img
                            key={itemId}
                            src={item.imageUrl}
                            alt={item.name || "item"}
                            style={{ width: "35px", height: "35px" }}
                            className="object-contain"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    style={{  boxSizing: "border-box" }}
                    className="w-full overflow-hidden h-full flex items-center justify-center relative"
                  >
                    <img
                      src={accountImage.imageUrl}
                      alt="Account"
                      draggable={false}
                      onMouseDown={handleMouseDown}
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: "center",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        cursor: dragging ? "grabbing" : "grab",
                        position: "relative",
                      }}
                    />
                    {selectedAssets.length > 0 && (
                      <div
                        style={{
                          gap: `${border}px`,
                          background: bgColor,
                          padding: `${border}px`,
                          maxWidth: `${360 - 2 * border}px`, // Constrain to fit within container
                        }}
                        className="absolute bottom-0 right-0 flex flex-row items-end"
                      >
                        {selectedAssets.map((itemId) => {
                          const item = allAssets.find((s) => s.id === itemId);
                          if (!item) return null;
                          return (
                            <img
                              key={itemId}
                              src={item.imageUrl}
                              alt={item.name || "item"}
                              style={{ width: "35px", height: "35px" }}
                              className="object-contain"
                            />
                          );
                        })}
                      </div>
                    )}
                    {!paid && (   // 🔹 only show before payment
  <button
    onClick={(e) => {
      e.stopPropagation();
      removeAccountImage();
    }}
    className="remove-account-btn absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-opacity-90"
  >
    &times;
  </button>
)}

                  </div>
                </div>
              )}
              <input
                id="account-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAccountImageUpload}
              />
            </div> : null}
      

            {/* Collage grid */}
            <div
              className="grid place-items-center"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, ${imageWidth}px))`, // Use fixed width per column
                gap: `${border}px`,
                padding: `${border}px`,
                backgroundColor: bgColor,
                maxWidth: `${360}px`, // Match account image container
                boxSizing: "border-box",
                ...style,
              }}
            >
              {displayedItems.map((itemId) => {
                const item = allSkins.find((s) => s.id === itemId);
                if (!item) return <p key={itemId}>Select skins</p>;
                return (
                  <img
                    key={itemId}
                    src={item.imageUrl}
                    alt={item.name || "item"}
                    className="w-full h-full object-contain"
                    style={{ maxWidth: `${imageWidth}px` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Collage;