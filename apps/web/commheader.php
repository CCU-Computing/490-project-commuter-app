<?php
	// allows me to see all the errors so they can be fixed
	// will be turned off in a prouction environment
	error_reporting(E_ALL);
	ini_set('display_errors', "1");
	
	$currentFile = basename($_SERVER['SCRIPT_FILENAME']);
?>
<!DOCTYPE html lang="en-us">
<html>
	<head>
		<meta charset="utf-8">
		<meta name="author" content="Lucas Wedge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title><?php echo ucfirst($currentFile), PHP_EOL; ?></title>
	</head>
	<body>
		<header>
			<h1>CCU Commuting</h1>
			<nav>
				<?php 
			echo ($currentFile == "parking.php") ? "Parking" : '<a href="parking.php">Parking</a>';
			echo ($currentFile == "stats.php") ? "Stats" : '<a href="stats.php">Stats</a>';
		?>
			</nav>
		</header>