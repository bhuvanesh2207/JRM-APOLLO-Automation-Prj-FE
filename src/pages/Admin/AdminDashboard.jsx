// AdminDashboard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BannerImage from "../../assets/images/Automation.jpg";

// JRM card images
import JrmImg1 from "../../assets/images/DomainTraker.png";
import JrmImg2 from "../../assets/images/Clients.png";
import JrmImg3 from "../../assets/images/DomainTraker.avif";

// Apollo card images
import ApolloImg1 from "../../assets/images/DomainTraker.avif";
import ApolloImg2 from "../../assets/images/DomainTraker.avif";
import ApolloImg3 from "../../assets/images/DomainTraker.avif";

const CARD_DATA = {
  JRM: [
    { id: "j1", title: "Domain Tracker", image: JrmImg1, path: "/domain/all" },
    { id: "j2", title: "Clients", image: JrmImg2, path: "/client/all" },
    { id: "j3", title: "JRM Card 3", image: JrmImg3, path: "/jrm/card-3" },
  ],
  Apollo: [
    {
      id: "a1",
      title: "Apollo Card 1",
      image: ApolloImg1,
      path: "/apollo/domain-tracker",
    },
    {
      id: "a2",
      title: "Apollo Card 2",
      image: ApolloImg2,
      path: "/apollo/card-2",
    },
    {
      id: "a3",
      title: "Apollo Card 3",
      image: ApolloImg3,
      path: "/apollo/card-3",
    },
  ],
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("JRM");
  const navigate = useNavigate();

  const cards = CARD_DATA[activeTab] || [];

  return (
    <main className="app-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <section className="dashboard-wrapper">
            {/* Banner */}
            <div className="dashboard-hero">
              <img
                src={BannerImage}
                alt="Dashboard banner"
                className="dashboard-hero-image"
              />
            </div>

            <section className="dashboard-section">
              {/* Tabs */}
              <div className="dashboard-tabs-wrapper">
                <div className="dashboard-tabs">
                  {["JRM", "Apollo"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={
                        "dashboard-tab" +
                        (activeTab === tab ? " dashboard-tab--active" : "")
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards */}
              <div className="dashboard-card-grid">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`dashboard-card${
                      activeTab === "JRM"
                        ? " dashboard-card--jrm"
                        : " dashboard-card--apollo"
                    } cursor-pointer`}
                    onClick={() => navigate(card.path)}
                  >
                    <div className="dashboard-card-image">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="dashboard-card-image-el"
                      />
                    </div>
                    <div className="dashboard-card-title-wrapper">
                      <span className="dashboard-card-title">{card.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;
