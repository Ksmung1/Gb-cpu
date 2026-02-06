import React from "react";
import { useDarkMode } from "../../../../context/DarkModeContext";

const GenshinInfo = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <div
      className={`container mx-auto mt-5 py-4 ${
        isDarkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
      } min-h-screen`}
    >
      <header className="text-center mt-1 mb-2">
        <h1 className={`text-3xl font-bold ${
          isDarkMode ? "text-purple-400" : "text-purple-600"
        }`}>
          Genshin Impact Info
        </h1>
      </header>

      <section className="mb-8">
        <article
          className={`bg-${isDarkMode ? "gray-800" : "white"} p-4 rounded-lg `}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            What is Genshin Impact?
          </h2>
          <p
            className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
          >
            Genshin Impact is an action RPG game created by miHoYo and published
            by Cognosphere, also known as HoYoverse, globally. The game features
            an anime-style open world and an action-based battle system that
            involves switching between characters and utilizing elemental magic.
          </p>
        </article>
      </section>

      <section className="mb-8">
        <article
          className={`bg-${isDarkMode ? "gray-800" : "white"} p-4 rounded-lg`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            What are Genshin Impact Currencies?
          </h2>
          <p
            className={`text-${isDarkMode ? "gray-300" : "gray-700"} mb-4`}
          >
            Genshin Impact features an extensive currency system vital for
            character and weapon acquisition, progression, and various in-game
            activities. These currencies are broadly categorized into premium,
            wishing, and in-game types.
          </p>

          <div className="space-y-4">
            <div>
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Paid Currency - Genesis Crystals
              </h3>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
              >
                This is the only currency purchasable exclusively with real-life
                money from the Genesis Crystal Top-Up Shop (e.g., Genshin
                top-up center, Gamebar). They are primarily exchanged for
                Primogems at a 1:1 ratio.
              </p>
            </div>

            <div>
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Wishing Currencies - Fates
              </h3>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
              >
                Used for the Wishes (gacha) system to obtain Genshin characters
                and weapons. There are two types:
              </p>
              <ul
                className={`list-disc list-inside text-${
                  isDarkMode ? "gray-300" : "gray-700"
                } ml-4`}
              >
                <li>
                  <strong>Acquaint Fate</strong>: For standard, permanently
                  available Wishes.
                </li>
                <li>
                  <strong>Intertwined Fate</strong>: For special, limited-time
                  event Wishes.
                </li>
              </ul>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"} mt-2`}
              >
                Both types can be acquired using Primogems, Adventure Rank
                rewards, quests, events, Battle Pass, or monthly purchases via
                Masterless Stardust.
              </p>
            </div>

            <div>
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                In-Game Currencies
              </h3>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
              >
                <strong>Primogems</strong>: A main premium currency, primarily
                used for Wishes or to replenish Original Resin.
              </p>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
              >
                Other currencies such as Mora, Elemental Sigils, Masterless
                Stardust, Masterless Starglitter, Original Resin, Fragile Resin,
                Stella Fortunas, Dream Solvent, Experience Materials, and Realm
                Currency are available in-game for players to explore.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mb-8">
        <article
          className={`bg-${isDarkMode ? "gray-800" : "white"} p-4 rounded-lg `}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            How to Get Genshin Genesis Crystals and Primogems?
          </h2>
          <div className="space-y-4">
            <div>
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Genshin Genesis Crystals
              </h3>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
              >
                Premium currency, obtainable only by recharging in the game
                top-up store using real money. Prices and methods vary by
                channel/platform/region. In the in-game shop, navigate to the
                [Shop] option in the [Menu] and recharge via the [Crystal
                Top-Up] section. Third-party platforms like Gamebar offer
                secure options, prioritizing account safety.
              </p>
            </div>

            <div>
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Genshin Primogems
              </h3>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
              >
                Earned through in-game activities like world exploration, story
                quests, daily commissions, Battle Pass, and Spiral Abyss, or by
                converting Genesis Crystals. Note: Reverse conversion is not
                possible.
              </p>
            </div>

            <div>
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Cost-Effective Option - Blessing of the Welkin Moon
              </h3>
              <p
                className={`text-${isDarkMode ? "gray-300" : "gray-700"}`}
              >
                Upon purchase, players receive 300 Genesis Crystals and 90
                Primogems immediately. For the next 30 days, an additional 90
                Primogems are granted daily upon login. For the same price as
                300 Genesis Crystals, this yields 300 Genesis Crystals plus
                2700 Primogems.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section>
        <article
          className={`bg-${isDarkMode ? "gray-800" : "white"} p-4 rounded-lg `}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Why is Gamebar the Best Choice for Genshin Top-up?
          </h2>
          <p
            className={`text-${isDarkMode ? "gray-300" : "gray-700"} mb-4`}
          >
            Gamebar.in is a professional gaming transaction platform offering
            top-ups, item trading, and more for games like Genshin Impact,
            Zenless Zone Zero, PUBG Mobile, and Brawl Stars.
          </p>
          <ul
            className={`list-disc list-inside space-y-2 text-${
              isDarkMode ? "gray-300" : "gray-700"
            }`}
          >
            <li>
              <strong>Low Prices</strong>: Competitive prices for greater
              savings.
            </li>
            <li>
              <strong>100% Secure Transactions</strong>: Advanced encryption
              and strict data protection ensure payment and personal info
              safety.
            </li>
            <li>
              <strong>Multiple Payment Methods</strong>: Supports Visa,
              Digital Wallet, Debit cards, and more.
            </li>
            <li>
              <strong>24/7 Customer Support</strong>: Available around the
              clock with a "Reputation First! Customers Foremost!" approach.
            </li>
            <li>
              <strong>Quick Delivery</strong>: Genesis Crystals delivered
              within 3 minutes.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
};

export default GenshinInfo;