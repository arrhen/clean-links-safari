// Called from ViewController.swift.
function setVersion(version) {
    document.querySelector(".version").textContent = version ? "Version " + version : "";
}
