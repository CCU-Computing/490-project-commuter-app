<?php
	// allows me to see all the errors so they can be fixed
	// will be turned off in a prouction environment
	error_reporting(E_ALL);
	ini_set('display_errors', "1");
	
	$currentFile = basename($_SERVER['SCRIPT_FILENAME']);
	$pageName = pathinfo($currentFile, PATHINFO_FILENAME);
	$needsMapAssets = ($pageName === 'parking');
?>
<!DOCTYPE html>
<html lang="en-us">
	<head>
		<meta charset="utf-8">
		<meta name="author" content="Lucas Wedge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link
			href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
			rel="stylesheet"
			integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
			crossorigin="anonymous"
		>
		<link id="base" rel="stylesheet" href="base.css">
		<link id="mode" rel="stylesheet" href="lightMode.css">
		<?php if ($needsMapAssets): ?>
		<link
			rel="stylesheet"
			href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
			crossorigin=""
		>
		<style>
			#map {
				height: 70vh;
				min-height: 420px;
				width: 100%;
				border-radius: 12px;
				box-shadow: 0 2px 14px rgba(0, 0, 0, 0.12);
				overflow: hidden;
			}
			.parking-map-wrapper {
				position: relative;
				margin-block: 1.5rem;
			}
			.parking-map-note {
				margin-top: 0.5rem;
				font-size: 0.95rem;
				color: #444;
			}
		</style>
		<?php endif; ?>
		<title><?php echo ucfirst($pageName), PHP_EOL; ?></title>
	</head>
	<body>
		<header>
			<h1>CCU Commuting</h1>
			<nav>
				<span><?php echo ($currentFile === "parking.php") ? 'Parking' : '<a href="parking.php">Parking</a>'; ?></span>
				<span><?php echo ($currentFile === "stats.php") ? 'Stats' : '<a href="stats.php">Stats</a>'; ?></span>
				<button type="button" class="rounded" id="color">Change Color Mode</button>
			</nav>
			<hr>
		</header>
