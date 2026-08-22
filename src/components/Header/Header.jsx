import "./Header.css";

function Header() {
    return (
        <header className="header">

            <div className="header-left">
                <div>
                    <h1>Dashboard</h1>
                    <p>Panel principal</p>
                </div>
            </div>

            <div className="header-right">

                <button className="notification-button">
                    🔔
                    <span className="notification-badge">3</span>
                </button>

                <div className="header-user">
                    <div className="header-avatar">
                        AD
                    </div>

                    <div className="header-user-info">
                        <strong>Administrador</strong>
                        <span>Administrador</span>
                    </div>
                </div>

            </div>

        </header>
    );
}

export default Header;