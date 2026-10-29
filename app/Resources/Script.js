// state is "on", "off" or "unknown"; called from ViewController.swift.
function show(state) {
    document.body.classList.toggle("state-on", state === "on");
    document.body.classList.toggle("state-off", state === "off");
    document.body.classList.toggle("state-unknown", state !== "on" && state !== "off");
    document.querySelector(".open-preferences").textContent =
        state === "on" ? "Manage in Safari Settings…" : "Open Safari Settings…";
}

function setVersion(version) {
    document.querySelector(".version").textContent = version ? "Version " + version : "";
}

document.querySelector("button.open-preferences").addEventListener("click", function () {
    webkit.messageHandlers.controller.postMessage("open-preferences");
});
