(function () {
    const tema = localStorage.getItem("financecontrol-tema") || "dark";

    if (tema === "light") {
        document.documentElement.classList.add("light-mode");
    }
})();

function alternarTema() {
    const html = document.documentElement;

    const modoClaro = html.classList.toggle("light-mode");

    localStorage.setItem(
        "financecontrol-tema",
        modoClaro ? "light" : "dark"
    );
}