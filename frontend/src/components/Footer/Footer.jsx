import "./Footer.css";
import logo from "../../assets/images/logo.png";

function Footer() {
    return (
        <footer className="footer">
            <img
                className="footer__logo"
                src={logo}
                alt="Логотип"
                width="50"
                height="50"
            />
            <div className="footer__wraper">
                <p className="footer__copyright">
                    &copy; <span className="footer__title">И</span>
                </p>
                <span className="footer__city">Астана, {new Date().getFullYear()}</span>
            </div>
        </footer>
    );
}

export default Footer;