import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";
import "./MainLayout.css";

function MainLayout({ children }) {
    return (
        <div className="main-layout">

            <Sidebar />

            <div className="main-content">

                <Header />

                <main className="page-content">
                    {children}
                </main>

            </div>

        </div>
    );
}

export default MainLayout;