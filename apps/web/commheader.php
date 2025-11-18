<?php
	// allows me to see all the errors so they can be fixed
	// will be turned off in a production environment
	error_reporting(E_ALL);
	ini_set('display_errors', "1");
	
	$currentFile   = basename($_SERVER['SCRIPT_FILENAME']);
	$currentDate   = date('Y-m-d');
	$extensionLoc  = strpos($currentFile, ".");
	$pageName      = substr($currentFile, 0, $extensionLoc);
?>
<!DOCTYPE html>
<html lang="en-us">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	
	<!-- Bootstrap CSS -->
	<link rel="stylesheet"
	      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
	      integrity="sha384-8b8c9w4l9m4dG94ZukmqVJpW8+4KfWwE1Zb1ZrC+wN4M4U0DLM5eYwZCw2J+qK0E"
	      crossorigin="anonymous">

	<!-- App styles -->
	<link rel="stylesheet" href="base.css">
	<!-- Light/Dark mode – JS toggles this between lightMode.css and darkMode.css -->
	<link rel="stylesheet" id="mode" href="lightMode.css">
	
	<?php
		// Simple per–page description if you want it
		if ($currentFile === 'parking.php') {
			echo '<meta name="description" content="Live CCU parking lot availability and best–lot suggestions for commuters.">', PHP_EOL;
		} elseif ($currentFile === 'stats.php') {
			echo '<meta name="description" content="Historical parking fulfillment stats and special event reporting.">', PHP_EOL;
		}
	?>
<!-- Leaflet core -->
<link rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
  crossorigin=""
></script>

<!-- Leaflet Draw -->
<link rel="stylesheet"
      href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
<script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>

	<title><?php echo ucfirst($pageName), PHP_EOL; ?></title>
</head>
<body>
	<header class="mb-3">
		<h1 class="text-center my-3">CCU Commuting</h1>
		<nav class="d-flex justify-content-center align-items-center gap-3 mb-2">
			<span>
				<?php
					echo ($currentFile == "parking.php")
						? 'Parking'
						: '<a href="parking.php">Parking</a>';
				?>
			</span>
			<span>
				<?php
					echo ($currentFile == "stats.php")
						? 'Stats'
						: '<a href="stats.php">Stats</a>';
				?>
			</span>
			<button type="button" class="rounded btn btn-sm btn-outline-secondary ms-3" id="color">
				Change Color Mode
			</button>
		</nav>
		<hr>
	</header>
