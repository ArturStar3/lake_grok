import userIcon from "../../assets/images/no_user.png"
import "./Header.css";
import logo from "../../assets/images/logo.png";


function Header() {
    return (
        <header className="header">
            <div className="header__wraper">
                <img
                    className="header__logo"
                    src={logo}
                    alt="Логоти"
                    width="40"
                    height="40"
                />
                <h2 className="header__title">
                    И
                </h2>
            </div>
            <nav className="header__nav">
                <ul className="header__nav-list">
                    <li className="header__nav-item">
                        <img
                            className="header__user-img"
                            src={userIcon}
                            alt="Пользователь"
                            width="40"
                            height="40"
                        />
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Header;