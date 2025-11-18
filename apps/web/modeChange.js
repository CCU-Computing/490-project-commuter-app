let modeButton = document.getElementById("color");
modeButton.addEventListener("click", changeMode);

function changeMode()
{
	let colorCSS = document.getElementById("mode");
	if (colorCSS.href.endsWith("lightMode.css")) {
		colorCSS.href = "darkMode.css";
	} else {
		colorCSS.href = "lightMode.css";
	}
}
