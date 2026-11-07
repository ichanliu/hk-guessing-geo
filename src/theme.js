const savedTheme = (() => {
  try {
    return localStorage.getItem("jupas-theme");
  } catch (error) {
    console.warn("Unable to read the saved theme preference.", error);
    return null;
  }
})();

const initialTheme = savedTheme === "light" || savedTheme === "dark"
  ? savedTheme
  : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

document.documentElement.dataset.theme = initialTheme;
document.querySelector('meta[name="theme-color"]').content = initialTheme === "dark" ? "#151c17" : "#f6f7f3";
